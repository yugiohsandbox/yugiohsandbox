import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { v4 as uuid } from 'uuid'
import { useRoute, useRouter } from 'vue-router'

import { db } from '@/firebase/client'
import { authFetch } from '@/lib/authFetch'
import { createDefaultCrawlv3Config } from '@/lib/crawlv3/catalog'
import { applyCrawlv3Action, cloneGame } from '@/lib/crawlv3/game-state'
import { useUserStore } from '@/stores/user'
import type { Crawlv3Action, Crawlv3Game, Crawlv3Player } from '@/types/crawlv3'
import type { PendingCrawlv3ActionBatch, QueuedCrawlv3Action } from '@/types/crawlv3-ui'

export function useCrawlv3RoomSession() {
  const userStore = useUserStore()
  const route = useRoute()
  const router = useRouter()

  const gameId = ref<string | null>(null)
  const joinCode = ref(String(route.params.gameCode ?? ''))
  const loading = ref(false)
  const error = ref<string | null>(null)
  const serverSnapshot = shallowRef<Crawlv3Game | null>(null)
  const pendingActions = shallowRef<PendingCrawlv3ActionBatch[]>([])
  const sendQueue: PendingCrawlv3ActionBatch[] = []
  let sending = false
  let unsubscribeGame: Unsubscribe | null = null
  let errorTimer: ReturnType<typeof setTimeout> | null = null

  const myPlayer = computed<Crawlv3Player | null>(() => {
    if (!serverSnapshot.value || !userStore.user) return null
    if (serverSnapshot.value.players.player1?.uid === userStore.user.firebaseUid) return 'player1'
    if (serverSnapshot.value.players.player2?.uid === userStore.user.firebaseUid) return 'player2'
    return null
  })

  const opponentPlayer = computed<Crawlv3Player | null>(() => {
    if (!myPlayer.value) return null
    return myPlayer.value === 'player1' ? 'player2' : 'player1'
  })

  const game = computed<Crawlv3Game | null>(() => {
    if (!serverSnapshot.value) return null
    let state = cloneGame(serverSnapshot.value)
    for (const batch of pendingActions.value) {
      state = applyCrawlv3Action(state, batch.action, myPlayer.value ?? undefined)
    }
    return state
  })

  const phase = computed<'join' | 'lobby' | 'game'>(() => {
    if (!game.value) return 'join'
    return game.value.status === 'active' ? 'game' : 'lobby'
  })

  const isHost = computed(() => myPlayer.value === 'player1')
  const isPerspectiveFlipped = computed(() => myPlayer.value === 'player2')

  function subscribeToGame(id: string) {
    unsubscribeGame?.()
    unsubscribeGame = onSnapshot(doc(db, 'crawlv3_games', id), (snapshot) => {
      const data = snapshot.data() as Crawlv3Game | undefined
      if (!data) return
      serverSnapshot.value = data

      const snapshotVersion = data._version ?? 0
      pendingActions.value = pendingActions.value.filter(
        (batch) => batch.serverVersion === null || batch.serverVersion > snapshotVersion,
      )
    })
  }

  async function createGame() {
    loading.value = true
    error.value = null

    try {
      const response = await authFetch('/.netlify/functions/create-crawlv3', {
        method: 'POST',
        body: JSON.stringify({
          username: userStore.user?.username,
          config: cloneGame(createDefaultCrawlv3Config()),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Failed to create room')

      gameId.value = data.id
      joinCode.value = String(data.code)
      router.replace({ name: 'crawlv3', params: { gameCode: joinCode.value } })
      subscribeToGame(data.id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create room'
    } finally {
      loading.value = false
    }
  }

  async function joinGame() {
    loading.value = true
    error.value = null

    try {
      const response = await authFetch('/.netlify/functions/join-crawlv3', {
        method: 'POST',
        body: JSON.stringify({
          code: Number(joinCode.value),
          username: userStore.user?.username,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Failed to join room')

      gameId.value = data.id
      joinCode.value = String(data.code ?? joinCode.value)
      serverSnapshot.value = data as Crawlv3Game
      router.replace({ name: 'crawlv3', params: { gameCode: joinCode.value } })
      subscribeToGame(data.id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to join room'
    } finally {
      loading.value = false
    }
  }

  async function flushQueue() {
    if (sending || !sendQueue.length || !gameId.value) return
    sending = true
    const batch = sendQueue.shift()

    if (!batch) {
      sending = false
      return
    }

    try {
      const response = await authFetch('/.netlify/functions/crawlv3-action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: gameId.value,
          action: batch.action,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Action failed')

      batch.serverVersion = data.version ?? null
      const snapshotVersion = serverSnapshot.value?._version ?? 0
      if (batch.serverVersion !== null && batch.serverVersion <= snapshotVersion) {
        pendingActions.value = pendingActions.value.filter((candidate) => candidate !== batch)
      }
    } catch (err) {
      pendingActions.value = pendingActions.value.filter((candidate) => candidate !== batch)
      error.value = err instanceof Error ? err.message : 'Action failed'
    } finally {
      sending = false
      if (sendQueue.length) {
        void flushQueue()
      }
    }
  }

  function enqueueAction(action: QueuedCrawlv3Action) {
    const fullAction = { ...action, actionId: uuid() } as Crawlv3Action
    const batch: PendingCrawlv3ActionBatch = {
      action: fullAction,
      serverVersion: null,
    }
    pendingActions.value = [...pendingActions.value, batch]
    sendQueue.push(batch)
    void flushQueue()
  }

  function resetRoomSession() {
    unsubscribeGame?.()
    unsubscribeGame = null
    sendQueue.length = 0
    pendingActions.value = []
    serverSnapshot.value = null
    gameId.value = null
    joinCode.value = ''
    router.replace({ name: 'crawlv3' })
  }

  watch(error, (message) => {
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
    }

    if (!message) return
    errorTimer = setTimeout(() => {
      error.value = null
      errorTimer = null
    }, 5000)
  })

  onMounted(() => {
    if (route.params.gameCode) {
      joinCode.value = String(route.params.gameCode)
      void joinGame()
    }
  })

  onBeforeUnmount(() => {
    unsubscribeGame?.()
    if (errorTimer) clearTimeout(errorTimer)
  })

  return {
    gameId,
    joinCode,
    loading,
    error,
    serverSnapshot,
    pendingActions,
    myPlayer,
    opponentPlayer,
    game,
    phase,
    isHost,
    isPerspectiveFlipped,
    createGame,
    joinGame,
    enqueueAction,
    resetRoomSession,
  }
}
