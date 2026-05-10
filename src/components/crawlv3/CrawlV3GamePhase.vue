<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import CrawlV3Card from '@/components/crawlv3/CrawlV3Card.vue'
import CrawlV3CardPreviewModal from '@/components/crawlv3/CrawlV3CardPreviewModal.vue'
import CrawlV3CardTooltip from '@/components/crawlv3/CrawlV3CardTooltip.vue'
import CrawlV3CardZone from '@/components/crawlv3/CrawlV3CardZone.vue'
import CrawlV3DeckModal from '@/components/crawlv3/CrawlV3DeckModal.vue'
import CrawlV3DragGhost from '@/components/crawlv3/CrawlV3DragGhost.vue'
import CrawlV3Select from '@/components/crawlv3/CrawlV3Select.vue'
import CrawlV3ShortcutsModal from '@/components/crawlv3/CrawlV3ShortcutsModal.vue'
import CrawlV3StatusModal from '@/components/crawlv3/CrawlV3StatusModal.vue'
import { useCrawlv3Board } from '@/composables/crawlv3/useCrawlv3Board'
import { useCrawlv3Controller } from '@/composables/crawlv3/useCrawlv3Controller'
import { useCrawlv3SelectedCard } from '@/composables/crawlv3/useCrawlv3SelectedCard'
import { useCrawlv3StatusDefinitions } from '@/composables/crawlv3/useCrawlv3StatusDefinitions'
import cardBackImage from '@/assets/images/cards/cardback.png'
import { formatFaceLabel, formatPositionLabel, formatZoneLabel, shouldShowCardStat } from '@/lib/crawlv3/card-display'
import { getTopPileCard, getZoneCards } from '@/lib/crawlv3/game-state'
import { shuffleItems, withDefaultCatalogConfig } from '@/lib/crawlv3/ui-utils'
import type { Crawlv3CardState, Crawlv3Player } from '@/types/crawlv3'
import type { Crawlv3PileZone, OpenCrawlv3PileState } from '@/types/crawlv3-ui'

const { game, myPlayer, opponentPlayer, isPerspectiveFlipped, enqueueAction, resetRoomSession } = useCrawlv3Controller()

const selectedCardId = ref<string | null>(null)
const previewCardId = ref<string | null>(null)
const statusCardId = ref<string | null>(null)
const openPile = ref<OpenCrawlv3PileState | null>(null)
const shortcutsOpen = ref(false)
const selectedMoveMode = ref(false)
const fieldCardWidth = ref('calc(clamp(38rem, min(50vw, calc(100vh - 26rem)), 68rem) * 0.16 * 63 / 88)')
let hitPointShortcutBuffer = ''
let hitPointShortcutSign: 1 | -1 = -1
let hitPointShortcutTimer: ReturnType<typeof setTimeout> | null = null

const { statusDefinitions } = useCrawlv3StatusDefinitions({
  config: computed(() => game.value?.config),
})

const tableCards = computed(() => (game.value ? getZoneCards(game.value.cards, 'table') : []))
const myHandCards = computed(() =>
  game.value && myPlayer.value ? getZoneCards(game.value.cards, 'hand', myPlayer.value) : [],
)
const opponentHandCards = computed(() =>
  game.value && opponentPlayer.value ? getZoneCards(game.value.cards, 'hand', opponentPlayer.value) : [],
)
const myDeckCards = computed(() =>
  game.value && myPlayer.value ? getZoneCards(game.value.cards, 'deck', myPlayer.value) : [],
)
const opponentDeckCards = computed(() =>
  game.value && opponentPlayer.value ? getZoneCards(game.value.cards, 'deck', opponentPlayer.value) : [],
)
const myExtraDeckCards = computed(() =>
  game.value && myPlayer.value ? getZoneCards(game.value.cards, 'extraDeck', myPlayer.value) : [],
)
const opponentExtraDeckCards = computed(() =>
  game.value && opponentPlayer.value ? getZoneCards(game.value.cards, 'extraDeck', opponentPlayer.value) : [],
)
const myDiscardCards = computed(() =>
  game.value && myPlayer.value ? getZoneCards(game.value.cards, 'discard', myPlayer.value) : [],
)
const opponentDiscardCards = computed(() =>
  game.value && opponentPlayer.value ? getZoneCards(game.value.cards, 'discard', opponentPlayer.value) : [],
)
const myExhaustedCards = computed(() =>
  game.value && myPlayer.value ? getZoneCards(game.value.cards, 'exhausted', myPlayer.value) : [],
)
const opponentExhaustedCards = computed(() =>
  game.value && opponentPlayer.value ? getZoneCards(game.value.cards, 'exhausted', opponentPlayer.value) : [],
)

const myTopDiscardCard = computed(() =>
  game.value && myPlayer.value ? (getTopPileCard(game.value.cards, 'discard', myPlayer.value) ?? null) : null,
)
const myTopDeckCard = computed(() =>
  game.value && myPlayer.value ? (getTopPileCard(game.value.cards, 'deck', myPlayer.value) ?? null) : null,
)
const myTopExtraDeckCard = computed(() =>
  game.value && myPlayer.value ? (getTopPileCard(game.value.cards, 'extraDeck', myPlayer.value) ?? null) : null,
)
const myTopExhaustedCard = computed(() =>
  game.value && myPlayer.value ? (getTopPileCard(game.value.cards, 'exhausted', myPlayer.value) ?? null) : null,
)

const {
  hoveredTooltip,
  dragState,
  dragGhostStyle,
  clearBoardTransientUi,
  getCardRenderFace,
  canSeeCardDetails,
  cardPositionStyle,
  startCardDrag,
  moveCardToZone,
  drawTopDeckCard,
  shuffleDeck,
  shuffleDiscardIntoDeck,
  updateTooltip,
  clearTooltip,
} = useCrawlv3Board({
  game,
  myPlayer,
  isPerspectiveFlipped,
  tableCards,
  myHandCards,
  myDeckCards,
  myDiscardCards,
  fieldCardWidth,
  selectedCardId,
  enqueueAction,
})

const {
  statDrafts,
  selectedAtk,
  selectedDef,
  selectedRace,
  selectedDamageType,
  focusedSelectedStat,
  selectedOwnCard,
  selectedOwnCardPreview,
  statusCard,
  statusLabels,
  raceOptions,
  damageTypeOptions,
  savePlayerStats,
  adjustLifePoints,
  adjustActionPoints,
  resetActionPoints,
  saveSelectedStat,
  blurSelectedStat,
  saveSelectedDetail,
  toggleSelectedFace,
  toggleSelectedRotation,
  decrementCardStatus,
  incrementCardStatus,
  saveSelectedStatuses,
  getCardStatusEntries,
  clearSelectedCardState,
} = useCrawlv3SelectedCard({
  game,
  myPlayer,
  statusDefinitions,
  selectedCardId,
  statusCardId,
  enqueueAction,
})

const tooltipCard = computed(() => {
  if (!game.value || !hoveredTooltip.value) return null
  return game.value.cards[hoveredTooltip.value.cardId] ?? null
})

const previewCard = computed(() => {
  if (!game.value || !previewCardId.value) return null
  return game.value.cards[previewCardId.value] ?? null
})

const dragPreviewCard = computed(() => {
  if (!game.value || !dragState.value) return null
  const card = game.value.cards[dragState.value.instanceId]
  if (!card) return null

  if (dragState.value.previewFaceUp === undefined && dragState.value.previewRotated === undefined) return card

  return {
    ...card,
    faceUp: dragState.value.previewFaceUp ?? card.faceUp,
    rotated: dragState.value.previewRotated ?? card.rotated,
  }
})

const dragPreviewShowFace = computed(() => {
  if (!dragPreviewCard.value) return false
  return dragState.value?.previewFaceUp ?? getCardRenderFace(dragPreviewCard.value)
})

const tooltipBuffs = computed(() => (tooltipCard.value ? getCardStatusEntries(tooltipCard.value, 'buff') : []))
const tooltipDebuffs = computed(() => (tooltipCard.value ? getCardStatusEntries(tooltipCard.value, 'debuff') : []))
const selectedRaceOptions = computed(() => [
  { value: '', label: 'No race' },
  ...raceOptions.value.map((option) => ({ value: option, label: option })),
])
const selectedDamageTypeOptions = computed(() => [
  { value: '', label: 'No type' },
  ...damageTypeOptions.value.map((option) => ({ value: option, label: option })),
])

const fieldImageUrl = computed(() =>
  game.value ? withDefaultCatalogConfig(game.value.config).fieldImageUrl.trim() : '',
)

const activePileCards = computed(() => {
  if (!openPile.value || !game.value) return []
  const cards = getZoneCards(game.value.cards, openPile.value.zone, openPile.value.owner)
  if (!openPile.value.visibleCardIds) return cards

  const cardMap = new Map(cards.map((card) => [card.instanceId, card]))
  return openPile.value.visibleCardIds
    .map((instanceId) => cardMap.get(instanceId))
    .filter((card): card is Crawlv3CardState => !!card)
})

const activePileInteractive = computed(() => !!openPile.value && openPile.value.owner === myPlayer.value)

const activePileTitle = computed(() => {
  if (!game.value || !openPile.value) return ''
  const playerName = game.value.players[openPile.value.owner]?.username ?? 'Player'
  return `${playerName} ${formatZoneLabel(openPile.value.zone)}`
})

function clearTransientUi() {
  clearBoardTransientUi()
}

function leaveRoom() {
  previewCardId.value = null
  clearSelectedCardState()
  openPile.value = null
  shortcutsOpen.value = false
  resetRoomSession()
  clearTransientUi()
}

function completeGame() {
  enqueueAction({
    type: 'complete_game',
  })
  selectedCardId.value = null
  statusCardId.value = null
  previewCardId.value = null
  openPile.value = null
  shortcutsOpen.value = false
  clearTransientUi()
}

function moveSelectedCardTo(zone: Crawlv3PileZone | 'table' | 'hand') {
  if (!selectedOwnCard.value) return
  moveCardToZone(selectedOwnCard.value.instanceId, zone)
  selectedMoveMode.value = false
}

function openPileViewer(owner: Crawlv3Player, zone: Crawlv3PileZone) {
  if (owner !== myPlayer.value && (zone === 'discard' || zone === 'exhausted')) return
  const cards = game.value ? getZoneCards(game.value.cards, zone, owner) : []
  openPile.value = {
    owner,
    zone,
    visibleCardIds: zone === 'deck' || zone === 'extraDeck' ? shuffleItems(cards).map((card) => card.instanceId) : null,
  }
}

function pilePreviewImage(card: Crawlv3CardState | null) {
  return card?.imageUrl || ''
}

function startTopPileDrag(zone: Crawlv3PileZone, event: PointerEvent) {
  if (zone === 'deck' && myTopDeckCard.value) {
    startCardDrag(myTopDeckCard.value, event)
  } else if (zone === 'extraDeck' && myTopExtraDeckCard.value) {
    startCardDrag(myTopExtraDeckCard.value, event)
  } else if (zone === 'discard' && myTopDiscardCard.value) {
    startCardDrag(myTopDiscardCard.value, event)
  } else if (zone === 'exhausted' && myTopExhaustedCard.value) {
    startCardDrag(myTopExhaustedCard.value, event)
  }
}

function updateFieldCardWidth(size: { height: number }) {
  fieldCardWidth.value = `${size.height * 0.16 * (63 / 88)}px`
}

const buttonClasses = {
  neutral:
    'cursor-pointer rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5',
  hand: 'cursor-pointer rounded-full border border-sky-300/35 bg-sky-300/15 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/55 hover:bg-sky-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  table:
    'cursor-pointer rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300/55 hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  deck: 'cursor-pointer rounded-full border border-indigo-300/35 bg-indigo-300/15 px-3 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-300/55 hover:bg-indigo-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  extraDeck:
    'cursor-pointer rounded-full border border-violet-300/35 bg-violet-300/15 px-3 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-300/55 hover:bg-violet-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  exhausted:
    'cursor-pointer rounded-full border border-fuchsia-300/35 bg-fuchsia-300/15 px-3 py-2 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/55 hover:bg-fuchsia-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  icon: 'cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-xl leading-none font-normal text-white/85 transition hover:border-white/30 hover:bg-white/5',
  discard:
    'cursor-pointer rounded-full border border-rose-300/35 bg-rose-300/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300/55 hover:bg-rose-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  flip: 'cursor-pointer rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/55 hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  position:
    'cursor-pointer rounded-full border border-orange-300/35 bg-orange-300/15 px-3 py-2 text-sm font-semibold text-orange-100 transition hover:border-orange-300/55 hover:bg-orange-300/25 disabled:cursor-not-allowed disabled:opacity-50',
} as const

function isOwnCardInteractive(card: Crawlv3CardState) {
  return card.owner === myPlayer.value
}

function isKeyboardShortcutTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  if (!element) return true
  return !element.closest('input, textarea, select, [contenteditable="true"]')
}

function getKeyboardDigit(event: KeyboardEvent) {
  if (/^Digit\d$/.test(event.code)) return event.code.slice(5)
  if (/^Numpad\d$/.test(event.code)) return event.code.slice(6)
  return null
}

function clearHitPointShortcutTimer() {
  if (!hitPointShortcutTimer) return
  clearTimeout(hitPointShortcutTimer)
  hitPointShortcutTimer = null
}

function commitHitPointShortcutBuffer() {
  if (!myPlayer.value || !hitPointShortcutBuffer) return
  const amount = Number(hitPointShortcutBuffer)
  hitPointShortcutBuffer = ''
  clearHitPointShortcutTimer()
  if (!Number.isFinite(amount) || amount <= 0) return
  adjustLifePoints(myPlayer.value, amount * hitPointShortcutSign)
}

function queueHitPointShortcutDigit(digit: string, sign: 1 | -1) {
  if (hitPointShortcutBuffer && hitPointShortcutSign !== sign) {
    commitHitPointShortcutBuffer()
  }

  hitPointShortcutSign = sign
  hitPointShortcutBuffer = `${hitPointShortcutBuffer}${digit}`
  clearHitPointShortcutTimer()
  hitPointShortcutTimer = setTimeout(commitHitPointShortcutBuffer, 2000)
}

function handleKeyboardShortcut(event: KeyboardEvent) {
  if (event.repeat || !isKeyboardShortcutTarget(event.target)) return

  if (event.key === 'Escape') {
    if (statusCardId.value || previewCardId.value || openPile.value || shortcutsOpen.value) {
      event.preventDefault()
      statusCardId.value = null
      previewCardId.value = null
      openPile.value = null
      shortcutsOpen.value = false
    }
    return
  }

  const digit = getKeyboardDigit(event)
  if (digit !== null) {
    event.preventDefault()
    queueHitPointShortcutDigit(digit, event.shiftKey ? 1 : -1)
    return
  }

  const key = event.key.toLowerCase()
  if (event.code === 'Space') {
    event.preventDefault()
    drawTopDeckCard()
    return
  }

  if (key === 'a') {
    event.preventDefault()
    if (myPlayer.value) adjustActionPoints(myPlayer.value, event.shiftKey ? 1 : -1)
    return
  }

  if (key === 'r') {
    event.preventDefault()
    if (myPlayer.value) resetActionPoints(myPlayer.value)
    return
  }

  if (!selectedOwnCard.value) return

  if (key === 'm') {
    event.preventDefault()
    statusCardId.value = selectedOwnCard.value.instanceId
    return
  }

  if (key === 'd') {
    event.preventDefault()
    moveSelectedCardTo('discard')
    return
  }

  if (key === 'e') {
    event.preventDefault()
    moveSelectedCardTo('exhausted')
    return
  }

  if (key === 'h') {
    event.preventDefault()
    moveSelectedCardTo('hand')
    return
  }

  if (key === 't') {
    event.preventDefault()
    moveSelectedCardTo('table')
    return
  }

  if (selectedOwnCard.value.zone !== 'table') return

  if (key === 'f') {
    event.preventDefault()
    toggleSelectedFace()
  } else if (key === 's') {
    event.preventDefault()
    toggleSelectedRotation()
  }
}

watch(
  () => selectedOwnCard.value?.instanceId,
  () => {
    selectedMoveMode.value = false
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyboardShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardShortcut)
  clearHitPointShortcutTimer()
})
</script>

<template>
  <div v-if="game && myPlayer && opponentPlayer" class="mx-auto py-6">
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div class="space-y-4">
        <header
          class="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-neutral-950/70 px-5 py-4 shadow-2xl backdrop-blur-sm"
        >
          <div>
            <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Room Code</p>
            <p class="mt-1 text-3xl font-semibold tracking-[0.2em] text-amber-200">{{ game.code }}</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="cursor-pointer rounded-full border border-sky-300/35 bg-sky-300/12 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-300/18"
              @click="shortcutsOpen = true"
            >
              Shortcuts
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-full border border-amber-300/35 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-300/18"
              @click="completeGame"
            >
              Complete Game
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
              @click="leaveRoom"
            >
              Leave Game
            </button>
          </div>
        </header>

        <section class="space-y-4">
          <div class="grid gap-4 xl:grid-cols-5">
            <div class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm">
              <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent</p>
              <h2 class="mt-2 text-2xl font-semibold">{{ game.players[opponentPlayer]?.username }}</h2>

              <div class="mt-4 space-y-3">
                <div class="space-y-2">
                  <span class="mb-2 block text-sm text-white/60">Hit Points</span>
                  <div class="flex flex-wrap items-center gap-2">
                    <input
                      v-model="statDrafts[opponentPlayer].lifePoints"
                      type="number"
                      readonly
                      class="min-w-[7rem] flex-1 rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-white/75 outline-none"
                    />
                  </div>
                </div>
                <div class="space-y-2">
                  <span class="block text-sm text-white/60">Action Points</span>
                  <div class="flex flex-wrap items-center gap-2">
                    <input
                      v-model="statDrafts[opponentPlayer].actionPoints"
                      type="number"
                      readonly
                      class="min-w-[7rem] flex-1 rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-white/75 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="discard"
              :data-crawlv3-owner="opponentPlayer"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent Discard</p>
              </div>

              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20 overflow-hidden border border-white/10 bg-transparent shadow-lg">
                  <img
                    v-if="opponentDiscardCards.length"
                    :src="cardBackImage"
                    alt="Opponent discard pile"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7e6c0_0%,#ddc48f_35%,#7b5f31_100%)] p-3 text-center text-xs font-semibold text-amber-950"
                  >
                    Discard
                  </div>
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ opponentDiscardCards.length }}</p>
                </div>
              </div>
            </div>

            <div
              class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="exhausted"
              :data-crawlv3-owner="opponentPlayer"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent Exhausted</p>
              </div>

              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20 overflow-hidden border border-white/10 bg-transparent shadow-lg">
                  <img
                    v-if="opponentExhaustedCards.length"
                    :src="cardBackImage"
                    alt="Opponent exhausted pile"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7e6c0_0%,#ddc48f_35%,#7b5f31_100%)] p-3 text-center text-xs font-semibold text-amber-950"
                  >
                    Exhausted
                  </div>
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ opponentExhaustedCards.length }}</p>
                </div>
              </div>
            </div>

            <div
              class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="deck"
              :data-crawlv3-owner="opponentPlayer"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent Deck</p>
              </div>
              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20">
                  <div
                    v-if="!opponentDeckCards.length"
                    class="absolute inset-0 border border-dashed border-white/10 bg-white/5"
                  />
                  <img
                    v-for="depth in Math.min(opponentDeckCards.length, 3)"
                    :key="depth"
                    :src="cardBackImage"
                    alt="Deck pile"
                    class="absolute inset-0 h-full w-full border border-white/10 object-cover shadow-lg"
                    :style="{ transform: `translate(${(depth - 1) * 5}px, ${(depth - 1) * 3}px)` }"
                  />
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ opponentDeckCards.length }}</p>
                </div>
              </div>
            </div>

            <div
              class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="extraDeck"
              :data-crawlv3-owner="opponentPlayer"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent Extra Deck</p>
              </div>
              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20">
                  <div
                    v-if="!opponentExtraDeckCards.length"
                    class="absolute inset-0 border border-dashed border-white/10 bg-white/5"
                  />
                  <img
                    v-for="depth in Math.min(opponentExtraDeckCards.length, 3)"
                    :key="depth"
                    :src="cardBackImage"
                    alt="Extra deck pile"
                    class="absolute inset-0 h-full w-full border border-white/10 object-cover shadow-lg"
                    :style="{ transform: `translate(${(depth - 1) * 5}px, ${(depth - 1) * 3}px)` }"
                  />
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ opponentExtraDeckCards.length }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-3 shadow-2xl backdrop-blur-sm">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent Hand</p>
                <p class="mt-1 text-sm text-white/55">{{ opponentHandCards.length }} cards</p>
              </div>
            </div>

            <CrawlV3CardZone
              :cards="opponentHandCards"
              drop-zone="hand"
              :owner="opponentPlayer"
              empty-label="Opponent hand zone"
              zone-class="relative h-[clamp(10.5rem,15vh,13rem)] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(135deg,rgba(61,99,114,0.15),rgba(20,22,33,0.65))] ring-1 ring-white/5"
              :status-labels="statusLabels"
              :card-position-style="cardPositionStyle"
              :get-card-render-face="getCardRenderFace"
              :is-card-interactive="() => false"
              @card-pointerdown="startCardDrag"
              @card-preview="previewCardId = $event"
              @card-tooltip="updateTooltip"
              @card-tooltip-clear="clearTooltip"
              @decrement-status="decrementCardStatus"
              @increment-status="incrementCardStatus"
              @zone-pointerdown="clearSelectedCardState"
            />
          </div>
        </section>

        <section class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Shared Table</p>
              <p class="mt-1 text-sm text-white/55">{{ tableCards.length }} cards in play</p>
            </div>
            <p class="text-sm text-white/45">Drag cards onto the field to play them.</p>
            <!--
              <div class="flex flex-wrap items-center justify-end gap-3">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-white/45">Card Size {{ boardCardScaleLabel }}</span>
                  <button type="button" :class="buttonClasses.icon" @click="adjustBoardCardScale(-0.1)">-</button>
                  <button type="button" :class="buttonClasses.icon" @click="adjustBoardCardScale(0.1)">+</button>
                </div>
              </div>
            -->
          </div>

          <CrawlV3CardZone
            :cards="tableCards"
            drop-zone="table"
            empty-label="Shared table"
            zone-class="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(69,46,24,0.22),rgba(20,16,13,0.78)),radial-gradient(circle_at_top,rgba(210,167,93,0.22),transparent_45%)] [container-type:size] ring-1 ring-white/5"
            :field-image-url="fieldImageUrl"
            match-field-image-aspect
            :selected-card-id="selectedCardId"
            :status-labels="statusLabels"
            show-grid
            :card-position-style="cardPositionStyle"
            :get-card-render-face="getCardRenderFace"
            :is-card-interactive="isOwnCardInteractive"
            @card-pointerdown="startCardDrag"
            @card-preview="previewCardId = $event"
            @card-tooltip="updateTooltip"
            @card-tooltip-clear="clearTooltip"
            @decrement-status="decrementCardStatus"
            @increment-status="incrementCardStatus"
            @zone-resize="updateFieldCardWidth"
            @zone-pointerdown="clearSelectedCardState"
          />
        </section>

        <section class="space-y-4">
          <div class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-3 shadow-2xl backdrop-blur-sm">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Your Hand</p>
                <p class="mt-1 text-sm text-white/55">{{ myHandCards.length }} cards</p>
              </div>
              <p class="text-sm text-white/45">Cards here stay face-up for you and hidden from your opponent</p>
            </div>

            <CrawlV3CardZone
              :cards="myHandCards"
              drop-zone="hand"
              :owner="myPlayer"
              empty-label="Your hand zone"
              zone-class="relative h-[clamp(10.5rem,15vh,13rem)] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(135deg,rgba(54,79,55,0.15),rgba(20,22,33,0.65))] ring-1 ring-white/5"
              :selected-card-id="selectedCardId"
              :status-labels="statusLabels"
              :card-position-style="cardPositionStyle"
              :get-card-render-face="getCardRenderFace"
              :is-card-interactive="isOwnCardInteractive"
              @card-pointerdown="startCardDrag"
              @card-preview="previewCardId = $event"
              @card-tooltip="updateTooltip"
              @card-tooltip-clear="clearTooltip"
              @decrement-status="decrementCardStatus"
              @increment-status="incrementCardStatus"
              @zone-pointerdown="clearSelectedCardState"
            />
          </div>

          <div class="grid gap-4 xl:grid-cols-6">
            <div
              class="order-1 rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm xl:col-span-2"
            >
              <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">You</p>
              <h2 class="mt-2 text-2xl font-semibold">{{ game.players[myPlayer]?.username }}</h2>

              <div class="mt-4 space-y-3">
                <div class="space-y-2">
                  <span class="mb-2 block text-sm text-white/60">Hit Points</span>
                  <div class="flex flex-wrap items-center gap-2">
                    <input
                      v-model="statDrafts[myPlayer].lifePoints"
                      type="number"
                      class="min-w-[7rem] flex-1 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none focus:border-amber-300/50"
                      @keyup.enter="savePlayerStats(myPlayer)"
                      @blur="savePlayerStats(myPlayer)"
                    />
                    <button type="button" :class="buttonClasses.neutral" @click="adjustLifePoints(myPlayer, -5)">
                      -5
                    </button>
                    <button type="button" :class="buttonClasses.neutral" @click="adjustLifePoints(myPlayer, -1)">
                      -1
                    </button>
                    <button type="button" :class="buttonClasses.neutral" @click="adjustLifePoints(myPlayer, 1)">
                      +1
                    </button>
                    <button type="button" :class="buttonClasses.neutral" @click="adjustLifePoints(myPlayer, 5)">
                      +5
                    </button>
                  </div>
                </div>
                <div class="space-y-2">
                  <span class="block text-sm text-white/60">Action Points</span>
                  <div class="flex flex-wrap items-center gap-2">
                    <input
                      v-model="statDrafts[myPlayer].actionPoints"
                      type="number"
                      class="min-w-[7rem] flex-1 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none focus:border-amber-300/50"
                      @keyup.enter="savePlayerStats(myPlayer)"
                      @blur="savePlayerStats(myPlayer)"
                    />
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                      @click="adjustActionPoints(myPlayer, -1)"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                      @click="adjustActionPoints(myPlayer, 1)"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                      @click="resetActionPoints(myPlayer)"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="order-3 rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="discard"
              :data-crawlv3-owner="myPlayer"
              @contextmenu.prevent="openPileViewer(myPlayer, 'discard')"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Your Discard</p>
              </div>

              <div class="mt-4 flex items-center gap-4">
                <div
                  class="relative h-28 w-20 cursor-pointer overflow-hidden border border-white/10 bg-transparent shadow-lg"
                  @pointerdown="startTopPileDrag('discard', $event)"
                >
                  <img
                    v-if="pilePreviewImage(myTopDiscardCard)"
                    :src="pilePreviewImage(myTopDiscardCard)"
                    alt="Your discard pile"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7e6c0_0%,#ddc48f_35%,#7b5f31_100%)] p-3 text-center text-xs font-semibold text-amber-950"
                  >
                    Discard
                  </div>
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ myDiscardCards.length }}</p>
                </div>
              </div>

              <div class="mt-4">
                <button
                  type="button"
                  :class="buttonClasses.deck"
                  :disabled="!myDiscardCards.length"
                  @click="shuffleDiscardIntoDeck"
                >
                  Shuffle Into Deck
                </button>
              </div>
            </div>

            <div
              class="order-5 rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="deck"
              :data-crawlv3-owner="myPlayer"
              @contextmenu.prevent="openPileViewer(myPlayer, 'deck')"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Your Deck</p>
              </div>
              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20 cursor-pointer" @pointerdown="startTopPileDrag('deck', $event)">
                  <div
                    v-if="!myDeckCards.length"
                    class="absolute inset-0 border border-dashed border-white/10 bg-white/5"
                  />
                  <img
                    v-for="depth in Math.min(myDeckCards.length, 3)"
                    :key="depth"
                    :src="cardBackImage"
                    alt="Deck pile"
                    class="absolute inset-0 h-full w-full border border-white/10 object-cover shadow-lg"
                    :style="{ transform: `translate(${(depth - 1) * 5}px, ${(depth - 1) * 3}px)` }"
                  />
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ myDeckCards.length }}</p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <button type="button" :class="buttonClasses.hand" @click="drawTopDeckCard">Draw Card</button>
                <button
                  type="button"
                  class="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                  @click="shuffleDeck"
                >
                  Shuffle
                </button>
              </div>
            </div>

            <div
              class="order-2 rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="exhausted"
              :data-crawlv3-owner="myPlayer"
              @contextmenu.prevent="openPileViewer(myPlayer, 'exhausted')"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Your Exhausted</p>
              </div>

              <div class="mt-4 flex items-center gap-4">
                <div
                  class="relative h-28 w-20 cursor-pointer overflow-hidden border border-white/10 bg-transparent shadow-lg"
                  @pointerdown="startTopPileDrag('exhausted', $event)"
                >
                  <img
                    v-if="pilePreviewImage(myTopExhaustedCard)"
                    :src="pilePreviewImage(myTopExhaustedCard)"
                    alt="Your exhausted pile"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7e6c0_0%,#ddc48f_35%,#7b5f31_100%)] p-3 text-center text-xs font-semibold text-amber-950"
                  >
                    Exhausted
                  </div>
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ myExhaustedCards.length }}</p>
                </div>
              </div>
            </div>

            <div
              class="order-4 rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="extraDeck"
              :data-crawlv3-owner="myPlayer"
              @contextmenu.prevent="openPileViewer(myPlayer, 'extraDeck')"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Your Extra Deck</p>
              </div>
              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20 cursor-pointer" @pointerdown="startTopPileDrag('extraDeck', $event)">
                  <div
                    v-if="!myExtraDeckCards.length"
                    class="absolute inset-0 border border-dashed border-white/10 bg-white/5"
                  />
                  <img
                    v-for="depth in Math.min(myExtraDeckCards.length, 3)"
                    :key="depth"
                    :src="cardBackImage"
                    alt="Extra deck pile"
                    class="absolute inset-0 h-full w-full border border-white/10 object-cover shadow-lg"
                    :style="{ transform: `translate(${(depth - 1) * 5}px, ${(depth - 1) * 3}px)` }"
                  />
                </div>
                <div>
                  <p class="text-2xl font-semibold">{{ myExtraDeckCards.length }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside
        class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-5 shadow-2xl backdrop-blur-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
      >
        <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Selected Card</p>

        <template v-if="selectedOwnCard">
          <div class="mt-4 flex justify-center">
            <CrawlV3Card
              :card="selectedOwnCardPreview ?? selectedOwnCard"
              :show-face="true"
              :status-labels="statusLabels"
              @contextmenu.prevent="previewCardId = selectedOwnCard.instanceId"
              @mouseenter.stop
              @mousemove.stop
              @mouseleave.stop
              @decrement-status="decrementCardStatus(selectedOwnCard.instanceId, $event.kind, $event.key)"
              @increment-status="incrementCardStatus(selectedOwnCard.instanceId, $event.kind, $event.key)"
            />
          </div>

          <h2 class="mt-4 text-2xl font-semibold">{{ selectedOwnCard.title }}</h2>
          <p class="mt-1 text-sm text-white/55">
            {{ formatZoneLabel(selectedOwnCard.zone) }} Zone | {{ formatFaceLabel(selectedOwnCard.faceUp) }} |
            {{ formatPositionLabel(selectedOwnCard.rotated) }}
          </p>

          <div
            v-if="shouldShowCardStat(selectedOwnCard, 'atk') || shouldShowCardStat(selectedOwnCard, 'def')"
            class="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <label v-if="shouldShowCardStat(selectedOwnCard, 'atk')" class="block">
              <span class="mb-2 block text-sm text-white/60">ATK</span>
              <input
                v-model="selectedAtk"
                type="text"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none focus:border-amber-300/50"
                @focus="focusedSelectedStat = 'atk'"
                @keyup.enter="saveSelectedStat('atk')"
                @blur="blurSelectedStat('atk')"
              />
            </label>
            <label v-if="shouldShowCardStat(selectedOwnCard, 'def')" class="block">
              <span class="mb-2 block text-sm text-white/60">DEF</span>
              <input
                v-model="selectedDef"
                type="text"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none focus:border-amber-300/50"
                @focus="focusedSelectedStat = 'def'"
                @keyup.enter="saveSelectedStat('def')"
                @blur="blurSelectedStat('def')"
              />
            </label>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm text-white/60">Race</span>
              <CrawlV3Select
                v-model="selectedRace"
                :options="selectedRaceOptions"
                @change="saveSelectedDetail('race')"
              />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm text-white/60">Type</span>
              <CrawlV3Select
                v-model="selectedDamageType"
                :options="selectedDamageTypeOptions"
                @change="saveSelectedDetail('damageType')"
              />
            </label>
          </div>

          <div class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
            <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Description</p>
            <p class="mt-3 text-sm whitespace-pre-wrap text-white/78">
              {{ selectedOwnCard.description || 'No description provided.' }}
            </p>
          </div>

          <div v-if="!selectedMoveMode" class="mt-4 grid gap-2">
            <button
              v-if="selectedOwnCard.zone === 'table'"
              type="button"
              :class="[buttonClasses.flip, 'w-full']"
              @click="toggleSelectedFace"
            >
              Flip card
            </button>
            <button
              v-if="selectedOwnCard.zone === 'table'"
              type="button"
              :class="[buttonClasses.position, 'w-full']"
              @click="toggleSelectedRotation"
            >
              Switch stance
            </button>
            <button
              type="button"
              class="w-full cursor-pointer rounded-full bg-amber-300 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
              @click="statusCardId = selectedOwnCard.instanceId"
            >
              Modifiers
            </button>
            <button type="button" :class="[buttonClasses.neutral, 'w-full']" @click="selectedMoveMode = true">
              Move
            </button>
          </div>

          <div v-else class="mt-4 grid gap-2">
            <button
              v-if="selectedOwnCard.zone !== 'hand'"
              type="button"
              :class="[buttonClasses.hand, 'w-full']"
              @click="moveSelectedCardTo('hand')"
            >
              Hand
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'table'"
              type="button"
              :class="[buttonClasses.table, 'w-full']"
              @click="moveSelectedCardTo('table')"
            >
              Table
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'exhausted'"
              type="button"
              :class="[buttonClasses.exhausted, 'w-full']"
              @click="moveSelectedCardTo('exhausted')"
            >
              Exhausted
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'discard'"
              type="button"
              :class="[buttonClasses.discard, 'w-full']"
              @click="moveSelectedCardTo('discard')"
            >
              Discard
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'extraDeck'"
              type="button"
              :class="[buttonClasses.extraDeck, 'w-full']"
              @click="moveSelectedCardTo('extraDeck')"
            >
              Extra Deck
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'deck'"
              type="button"
              :class="[buttonClasses.deck, 'w-full']"
              @click="moveSelectedCardTo('deck')"
            >
              Deck
            </button>
            <button type="button" :class="[buttonClasses.neutral, 'w-full']" @click="selectedMoveMode = false">
              Cancel
            </button>
          </div>

          <div
            v-if="
              getCardStatusEntries(selectedOwnCard, 'buff').length ||
              getCardStatusEntries(selectedOwnCard, 'debuff').length
            "
            class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
          >
            <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Statuses</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="status in getCardStatusEntries(selectedOwnCard, 'buff')"
                :key="`selected-buff-${status.id}`"
                class="rounded-full bg-emerald-400/85 px-2.5 py-1 text-xs font-semibold text-emerald-950"
              >
                {{ status.name }} {{ status.value }}
              </span>
              <span
                v-for="status in getCardStatusEntries(selectedOwnCard, 'debuff')"
                :key="`selected-debuff-${status.id}`"
                class="rounded-full bg-rose-400/85 px-2.5 py-1 text-xs font-semibold text-rose-950"
              >
                {{ status.name }} {{ status.value }}
              </span>
            </div>
          </div>
        </template>

        <div v-else class="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 p-5 text-sm text-white/55">
          Select one of your cards or drag it around the sandbox to edit it here.
        </div>
      </aside>
    </div>

    <CrawlV3DragGhost
      v-if="dragState?.active && dragPreviewCard"
      :card="dragPreviewCard"
      :style="dragGhostStyle"
      :show-face="dragPreviewShowFace"
      :status-labels="statusLabels"
    />

    <CrawlV3CardTooltip :card="tooltipCard" :point="hoveredTooltip" :buffs="tooltipBuffs" :debuffs="tooltipDebuffs" />

    <CrawlV3DeckModal
      v-if="openPile"
      :title="activePileTitle"
      :cards="activePileCards"
      :interactive="activePileInteractive"
      :allow-move-to-deck="
        (openPile.zone === 'extraDeck' || openPile.zone === 'discard' || openPile.zone === 'exhausted') &&
        activePileInteractive
      "
      :allow-move-to-extra-deck="openPile.zone !== 'extraDeck' && activePileInteractive"
      :allow-move-to-discard="
        (openPile.zone === 'deck' || openPile.zone === 'extraDeck' || openPile.zone === 'exhausted') &&
        activePileInteractive
      "
      :allow-move-to-exhausted="openPile.zone !== 'exhausted' && activePileInteractive"
      :status-labels="statusLabels"
      @close="openPile = null"
      @move-to-hand="moveCardToZone($event, 'hand')"
      @move-to-table="moveCardToZone($event, 'table')"
      @move-to-deck="moveCardToZone($event, 'deck')"
      @move-to-extra-deck="moveCardToZone($event, 'extraDeck')"
      @move-to-discard="moveCardToZone($event, 'discard')"
      @move-to-exhausted="moveCardToZone($event, 'exhausted')"
    />

    <CrawlV3CardPreviewModal
      v-if="previewCard"
      :card="previewCard"
      :show-face="canSeeCardDetails(previewCard)"
      @close="previewCardId = null"
    />

    <CrawlV3StatusModal
      v-if="statusCard"
      :card="statusCard"
      :status-definitions="statusDefinitions"
      @close="statusCardId = null"
      @save="saveSelectedStatuses"
    />

    <CrawlV3ShortcutsModal v-if="shortcutsOpen" @close="shortcutsOpen = false" />
  </div>
</template>
