import { computed } from 'vue'

import { createSharedComposable } from '@vueuse/core'

import { useCrawlv3RoomSession } from '@/composables/crawlv3/useCrawlv3RoomSession'

function createCrawlv3Controller() {
  const room = useCrawlv3RoomSession()

  const myDeckSelection = computed(() => {
    if (!room.game.value || !room.myPlayer.value) return null
    return room.game.value.deckSelections[room.myPlayer.value]
  })

  const isDeckReady = computed(() => !!myDeckSelection.value?.ready)
  const canEditDeckSelection = computed(() => !!room.myPlayer.value && !isDeckReady.value)

  function setReadyState(ready: boolean) {
    room.enqueueAction({
      type: 'set_ready',
      ready,
    })
  }

  return {
    ...room,
    myDeckSelection,
    isDeckReady,
    canEditDeckSelection,
    setReadyState,
  }
}

export const useCrawlv3Controller = createSharedComposable(createCrawlv3Controller)
