<script setup lang="ts">
import { computed, ref } from 'vue'

import CrawlV3Card from '@/components/crawlv3/CrawlV3Card.vue'
import CrawlV3CardPreviewModal from '@/components/crawlv3/CrawlV3CardPreviewModal.vue'
import type { Crawlv3CardState } from '@/types/crawlv3'
import { formatDisplayValue, getCardTags, hasDisplayValue, shouldShowCardStat } from '@/lib/crawlv3/card-display'

const props = defineProps<{
  title: string
  cards: Crawlv3CardState[]
  interactive?: boolean
  allowMoveToDeck?: boolean
  allowMoveToExtraDeck?: boolean
  allowMoveToDiscard?: boolean
  statusLabels?: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'move-to-hand', instanceId: string): void
  (e: 'move-to-table', instanceId: string): void
  (e: 'move-to-deck', instanceId: string): void
  (e: 'move-to-extra-deck', instanceId: string): void
  (e: 'move-to-discard', instanceId: string): void
}>()

const search = ref('')
const previewCard = ref<Crawlv3CardState | null>(null)
const tooltipCard = ref<Crawlv3CardState | null>(null)
const tooltipPoint = ref<{ x: number; y: number } | null>(null)

const uniqueCards = computed(() => {
  const seen = new Set<string>()

  return props.cards.filter((card) => {
    if (seen.has(card.instanceId)) return false
    seen.add(card.instanceId)
    return true
  })
})

const filteredCards = computed(() => {
  if (!search.value.trim()) return uniqueCards.value
  const query = search.value.trim().toLowerCase()
  return uniqueCards.value.filter((card) =>
    [card.title, card.cardId, card.category, card.description, card.race, card.damageType]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

const tooltipStyle = computed(() => {
  if (!tooltipPoint.value) return {}

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0

  return {
    left: `${Math.min(tooltipPoint.value.x + 18, Math.max(0, viewportWidth - 360))}px`,
    top: `${Math.min(tooltipPoint.value.y + 18, Math.max(0, viewportHeight - 260))}px`,
  }
})

function updateTooltip(card: Crawlv3CardState, event: MouseEvent) {
  tooltipCard.value = card
  tooltipPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }
}

function clearTooltip(card?: Crawlv3CardState) {
  if (!card || tooltipCard.value?.instanceId === card.instanceId) {
    tooltipCard.value = null
    tooltipPoint.value = null
  }
}

const buttonClasses = {
  hand: 'cursor-pointer rounded-full border border-sky-300/35 bg-sky-300/15 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:border-sky-300/55 hover:bg-sky-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  table:
    'cursor-pointer rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-300/55 hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  deck: 'cursor-pointer rounded-full border border-indigo-300/35 bg-indigo-300/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:border-indigo-300/55 hover:bg-indigo-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  extraDeck:
    'cursor-pointer rounded-full border border-violet-300/35 bg-violet-300/15 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:border-violet-300/55 hover:bg-violet-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  discard:
    'cursor-pointer rounded-full border border-rose-300/35 bg-rose-300/15 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:border-rose-300/55 hover:bg-rose-300/25 disabled:cursor-not-allowed disabled:opacity-50',
} as const
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[1000] bg-black/75 p-4 backdrop-blur-sm" @click="emit('close')">
      <div
        class="mx-auto flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-0 max-w-7xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl"
        @click.stop
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Pile View</p>
            <h2 class="mt-2 text-2xl font-semibold">{{ title }}</h2>
            <p class="mt-1 text-sm text-white/60">{{ cards.length }} cards</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <input
              v-model="search"
              type="text"
              placeholder="Search pile"
              class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-amber-300/50"
            />
            <button
              type="button"
              class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
              @click="emit('close')"
            >
              Close
            </button>
          </div>
        </div>

        <div class="mt-6 min-h-0 flex-1 overflow-hidden">
          <div
            class="grid h-full grid-cols-1 content-start gap-4 overflow-y-auto pr-2 sm:[grid-template-columns:repeat(auto-fill,minmax(13rem,13rem))] sm:justify-start"
          >
            <div
              v-for="card in filteredCards"
              :key="card.instanceId"
              class="rounded-[1.5rem] border border-white/10 bg-white/5 p-3 sm:w-[13rem]"
              @mouseenter="updateTooltip(card, $event)"
              @mousemove="updateTooltip(card, $event)"
              @mouseleave="clearTooltip(card)"
            >
              <div class="flex justify-center">
                <CrawlV3Card
                  :card="card"
                  :show-face="true"
                  :status-labels="statusLabels"
                  @contextmenu.prevent="previewCard = card"
                  @mouseenter.stop
                  @mousemove.stop
                  @mouseleave.stop
                />
              </div>

              <div v-if="interactive" class="mt-3 flex flex-wrap gap-2">
                <button
                  v-if="allowMoveToDeck"
                  type="button"
                  :class="buttonClasses.deck"
                  @click="emit('move-to-deck', card.instanceId)"
                >
                  Move to Deck
                </button>
                <button
                  v-if="allowMoveToExtraDeck"
                  type="button"
                  :class="buttonClasses.extraDeck"
                  @click="emit('move-to-extra-deck', card.instanceId)"
                >
                  Move to Extra Deck
                </button>
                <button
                  v-if="allowMoveToDiscard"
                  type="button"
                  :class="buttonClasses.discard"
                  @click="emit('move-to-discard', card.instanceId)"
                >
                  Move to Discard
                </button>
                <button type="button" :class="buttonClasses.hand" @click="emit('move-to-hand', card.instanceId)">
                  Move to Hand
                </button>
                <button type="button" :class="buttonClasses.table" @click="emit('move-to-table', card.instanceId)">
                  Move to Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CrawlV3CardPreviewModal v-if="previewCard" :card="previewCard" :show-face="true" @close="previewCard = null" />

      <div
        v-if="tooltipCard && tooltipPoint"
        class="pointer-events-none fixed z-[1001] max-w-sm rounded-[1.25rem] border border-white/10 bg-neutral-950/95 p-4 text-sm text-white shadow-2xl backdrop-blur-sm"
        :style="tooltipStyle"
      >
        <h3 class="text-lg font-semibold">{{ tooltipCard.title }}</h3>
        <p v-if="hasDisplayValue(tooltipCard.category)" class="mt-1 text-white/60">{{ tooltipCard.category }}</p>
        <div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-white/55">
          <span v-if="hasDisplayValue(tooltipCard.cost)"
            >Cost <span class="text-white">{{ tooltipCard.cost }}</span></span
          >
          <span v-if="shouldShowCardStat(tooltipCard, 'atk')"
            >ATK <span class="text-base font-bold text-white">{{ formatDisplayValue(tooltipCard.atk) }}</span></span
          >
          <span v-if="shouldShowCardStat(tooltipCard, 'def')"
            >DEF <span class="text-base font-bold text-white">{{ formatDisplayValue(tooltipCard.def) }}</span></span
          >
        </div>
        <p v-if="getCardTags(tooltipCard)" class="mt-1 text-white/55">{{ getCardTags(tooltipCard) }}</p>
        <p class="mt-3 whitespace-pre-wrap text-white/82">
          {{ tooltipCard.description || 'No description provided.' }}
        </p>
      </div>
    </div>
  </Teleport>
</template>
