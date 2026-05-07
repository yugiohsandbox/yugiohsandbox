<script setup lang="ts">
import { computed, ref } from 'vue'

import CrawlV3Card from '@/components/crawlv3/CrawlV3Card.vue'
import CrawlV3CardPreviewModal from '@/components/crawlv3/CrawlV3CardPreviewModal.vue'
import CrawlV3CardTooltip from '@/components/crawlv3/CrawlV3CardTooltip.vue'
import CrawlV3CardZone from '@/components/crawlv3/CrawlV3CardZone.vue'
import CrawlV3DeckModal from '@/components/crawlv3/CrawlV3DeckModal.vue'
import CrawlV3DragGhost from '@/components/crawlv3/CrawlV3DragGhost.vue'
import CrawlV3StatusModal from '@/components/crawlv3/CrawlV3StatusModal.vue'
import { useCrawlv3Board } from '@/composables/crawlv3/useCrawlv3Board'
import { useCrawlv3Controller } from '@/composables/crawlv3/useCrawlv3Controller'
import { useCrawlv3SelectedCard } from '@/composables/crawlv3/useCrawlv3SelectedCard'
import { useCrawlv3StatusDefinitions } from '@/composables/crawlv3/useCrawlv3StatusDefinitions'
import cardBackImage from '@/assets/images/cards/cardback.png'
import { formatFaceLabel, formatPositionLabel, formatZoneLabel, shouldShowCardStat } from '@/lib/crawlv3/card-display'
import { getTopPileCard, getZoneCards } from '@/lib/crawlv3/game-state'
import { shuffleItems } from '@/lib/crawlv3/ui-utils'
import type { Crawlv3CardState, Crawlv3Player } from '@/types/crawlv3'
import type { Crawlv3PileZone, OpenCrawlv3PileState } from '@/types/crawlv3-ui'

const { game, myPlayer, opponentPlayer, isPerspectiveFlipped, enqueueAction, resetRoomSession } = useCrawlv3Controller()

const selectedCardId = ref<string | null>(null)
const previewCardId = ref<string | null>(null)
const statusCardId = ref<string | null>(null)
const openPile = ref<OpenCrawlv3PileState | null>(null)

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
const myDiscardCards = computed(() =>
  game.value && myPlayer.value ? getZoneCards(game.value.cards, 'discard', myPlayer.value) : [],
)
const opponentDiscardCards = computed(() =>
  game.value && opponentPlayer.value ? getZoneCards(game.value.cards, 'discard', opponentPlayer.value) : [],
)

const myTopDiscardCard = computed(() =>
  game.value && myPlayer.value ? (getTopPileCard(game.value.cards, 'discard', myPlayer.value) ?? null) : null,
)
const opponentTopDiscardCard = computed(() =>
  game.value && opponentPlayer.value
    ? (getTopPileCard(game.value.cards, 'discard', opponentPlayer.value) ?? null)
    : null,
)

const {
  boardCardScaleLabel,
  hoveredTooltip,
  dragState,
  dragGhostStyle,
  clearBoardTransientUi,
  getCardRenderFace,
  canSeeCardDetails,
  cardPositionStyle,
  adjustBoardCardScale,
  startCardDrag,
  moveCardToZone,
  moveTopPileCardTo,
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
  selectedCardId,
  enqueueAction,
})

const {
  statDrafts,
  selectedAtk,
  selectedDef,
  focusedSelectedStat,
  selectedOwnCard,
  selectedOwnCardPreview,
  statusCard,
  statusLabels,
  savePlayerStats,
  adjustLifePoints,
  adjustActionPoints,
  resetActionPoints,
  saveSelectedStat,
  blurSelectedStat,
  toggleSelectedFace,
  toggleSelectedRotation,
  decrementCardStatus,
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

const tooltipBuffs = computed(() => (tooltipCard.value ? getCardStatusEntries(tooltipCard.value, 'buff') : []))
const tooltipDebuffs = computed(() => (tooltipCard.value ? getCardStatusEntries(tooltipCard.value, 'debuff') : []))

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
  clearTransientUi()
}

function openPileViewer(owner: Crawlv3Player, zone: Crawlv3PileZone) {
  const cards = game.value ? getZoneCards(game.value.cards, zone, owner) : []
  openPile.value = {
    owner,
    zone,
    visibleCardIds: zone === 'deck' ? shuffleItems(cards).map((card) => card.instanceId) : null,
  }
}

function pilePreviewImage(card: Crawlv3CardState | null) {
  return card?.imageUrl || ''
}

const buttonClasses = {
  neutral:
    'rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5',
  hand: 'rounded-full border border-sky-300/35 bg-sky-300/15 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/55 hover:bg-sky-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  table:
    'rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300/55 hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  deck: 'rounded-full border border-indigo-300/35 bg-indigo-300/15 px-3 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-300/55 hover:bg-indigo-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  discard:
    'rounded-full border border-rose-300/35 bg-rose-300/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300/55 hover:bg-rose-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  flip: 'rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/55 hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  position:
    'rounded-full border border-orange-300/35 bg-orange-300/15 px-3 py-2 text-sm font-semibold text-orange-100 transition hover:border-orange-300/55 hover:bg-orange-300/25 disabled:cursor-not-allowed disabled:opacity-50',
} as const
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
              class="rounded-full border border-amber-300/35 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-300/18"
              @click="completeGame"
            >
              Complete Game
            </button>
            <button
              type="button"
              class="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
              @click="leaveRoom"
            >
              Leave Game
            </button>
          </div>
        </header>

        <section class="space-y-4">
          <div class="grid gap-4 xl:grid-cols-3">
            <div class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm">
              <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent</p>
              <h2 class="mt-2 text-2xl font-semibold">{{ game.players[opponentPlayer]?.username }}</h2>

              <div class="mt-4 space-y-3">
                <div class="space-y-2">
                  <span class="mb-2 block text-sm text-white/60">Life Points</span>
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
              @contextmenu.prevent="openPileViewer(opponentPlayer, 'discard')"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Opponent Discard</p>
              </div>

              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20 overflow-hidden border border-white/10 bg-black/25 shadow-lg">
                  <img
                    v-if="pilePreviewImage(opponentTopDiscardCard)"
                    :src="pilePreviewImage(opponentTopDiscardCard)"
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
              @card-pointerdown="startCardDrag"
              @card-preview="previewCardId = $event"
              @card-tooltip="updateTooltip"
              @card-tooltip-clear="clearTooltip"
              @decrement-status="decrementCardStatus"
            />
          </div>
        </section>

        <section class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Shared Table</p>
              <p class="mt-1 text-sm text-white/55">{{ tableCards.length }} cards in play</p>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-3">
              <div class="flex items-center gap-2">
                <span class="text-sm text-white/45">Card Size {{ boardCardScaleLabel }}</span>
                <button type="button" :class="buttonClasses.neutral" @click="adjustBoardCardScale(-0.1)">-</button>
                <button type="button" :class="buttonClasses.neutral" @click="adjustBoardCardScale(0.1)">+</button>
              </div>
              <p class="text-sm text-white/45">Drag your cards anywhere in this zone</p>
            </div>
          </div>

          <CrawlV3CardZone
            :cards="tableCards"
            drop-zone="table"
            empty-label="Shared table"
            zone-class="relative h-[min(50vw,calc(100vh-26rem))] max-h-[68rem] min-h-[38rem] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(69,46,24,0.22),rgba(20,16,13,0.78)),radial-gradient(circle_at_top,rgba(210,167,93,0.22),transparent_45%)] ring-1 ring-white/5"
            :selected-card-id="selectedCardId"
            :status-labels="statusLabels"
            show-grid
            :card-position-style="cardPositionStyle"
            :get-card-render-face="getCardRenderFace"
            @card-pointerdown="startCardDrag"
            @card-preview="previewCardId = $event"
            @card-tooltip="updateTooltip"
            @card-tooltip-clear="clearTooltip"
            @decrement-status="decrementCardStatus"
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
              @card-pointerdown="startCardDrag"
              @card-preview="previewCardId = $event"
              @card-tooltip="updateTooltip"
              @card-tooltip-clear="clearTooltip"
              @decrement-status="decrementCardStatus"
            />
          </div>

          <div class="grid gap-4 xl:grid-cols-3">
            <div class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm">
              <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">You</p>
              <h2 class="mt-2 text-2xl font-semibold">{{ game.players[myPlayer]?.username }}</h2>

              <div class="mt-4 space-y-3">
                <div class="space-y-2">
                  <span class="mb-2 block text-sm text-white/60">Life Points</span>
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
                      class="rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                      @click="adjustActionPoints(myPlayer, -1)"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                      @click="adjustActionPoints(myPlayer, 1)"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                      @click="resetActionPoints(myPlayer)"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="discard"
              :data-crawlv3-owner="myPlayer"
              @contextmenu.prevent="openPileViewer(myPlayer, 'discard')"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Your Discard</p>
              </div>

              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20 overflow-hidden border border-white/10 bg-black/25 shadow-lg">
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

              <div class="mt-4 flex flex-wrap gap-2">
                <button type="button" :class="buttonClasses.hand" @click="moveTopPileCardTo('discard', 'hand')">
                  Top to Hand
                </button>
                <button type="button" :class="buttonClasses.table" @click="moveTopPileCardTo('discard', 'table')">
                  Top to Table
                </button>
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
              class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
              data-crawlv3-drop-zone="deck"
              :data-crawlv3-owner="myPlayer"
              @contextmenu.prevent="openPileViewer(myPlayer, 'deck')"
            >
              <div>
                <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Your Deck</p>
              </div>
              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-28 w-20">
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
                <button type="button" :class="buttonClasses.hand" @click="moveTopPileCardTo('deck', 'hand')">
                  Draw Card
                </button>
                <button
                  type="button"
                  class="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                  @click="shuffleDeck"
                >
                  Shuffle
                </button>
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

          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" :class="buttonClasses.flip" @click="toggleSelectedFace">Flip card</button>
            <button type="button" :class="buttonClasses.position" @click="toggleSelectedRotation">
              Switch position
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'hand'"
              type="button"
              :class="buttonClasses.hand"
              @click="moveCardToZone(selectedOwnCard.instanceId, 'hand')"
            >
              Move to Hand
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'table'"
              type="button"
              :class="buttonClasses.table"
              @click="moveCardToZone(selectedOwnCard.instanceId, 'table')"
            >
              Move to Table
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'deck'"
              type="button"
              :class="buttonClasses.deck"
              @click="moveCardToZone(selectedOwnCard.instanceId, 'deck')"
            >
              Move to Deck
            </button>
            <button
              v-if="selectedOwnCard.zone !== 'discard'"
              type="button"
              :class="buttonClasses.discard"
              @click="moveCardToZone(selectedOwnCard.instanceId, 'discard')"
            >
              Move to Discard
            </button>
            <button
              type="button"
              class="rounded-full bg-amber-300 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
              @click="statusCardId = selectedOwnCard.instanceId"
            >
              Modifiers
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

          <div class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
            <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Description</p>
            <p class="mt-3 text-sm whitespace-pre-wrap text-white/78">
              {{ selectedOwnCard.description || 'No description provided.' }}
            </p>
          </div>
        </template>

        <div v-else class="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 p-5 text-sm text-white/55">
          Select one of your cards or drag it around the sandbox to edit it here.
        </div>
      </aside>
    </div>

    <CrawlV3DragGhost
      v-if="dragState?.active && game?.cards[dragState.instanceId]"
      :card="game.cards[dragState.instanceId]"
      :style="dragGhostStyle"
      :show-face="getCardRenderFace(game.cards[dragState.instanceId])"
      :status-labels="statusLabels"
    />

    <CrawlV3CardTooltip :card="tooltipCard" :point="hoveredTooltip" :buffs="tooltipBuffs" :debuffs="tooltipDebuffs" />

    <CrawlV3DeckModal
      v-if="openPile"
      :title="activePileTitle"
      :cards="activePileCards"
      :interactive="activePileInteractive"
      :allow-move-to-deck="openPile.zone === 'discard' && activePileInteractive"
      :allow-move-to-discard="openPile.zone === 'deck' && activePileInteractive"
      :status-labels="statusLabels"
      @close="openPile = null"
      @move-to-hand="moveCardToZone($event, 'hand')"
      @move-to-table="moveCardToZone($event, 'table')"
      @move-to-deck="moveCardToZone($event, 'deck')"
      @move-to-discard="moveCardToZone($event, 'discard')"
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
  </div>
</template>
