<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import CrawlV3CardPreviewModal from '@/components/crawlv3/CrawlV3CardPreviewModal.vue'
import CrawlV3CatalogTooltip from '@/components/crawlv3/CrawlV3CatalogTooltip.vue'
import CrawlV3Select from '@/components/crawlv3/CrawlV3Select.vue'
import { useCrawlv3Catalog } from '@/composables/crawlv3/useCrawlv3Catalog'
import { useCrawlv3Controller } from '@/composables/crawlv3/useCrawlv3Controller'
import { getCardTags } from '@/lib/crawlv3/card-display'
import { createCatalogPreviewCardState, safeTrim } from '@/lib/crawlv3/ui-utils'
import type { Crawlv3CatalogCard, Crawlv3CatalogConfig } from '@/types/crawlv3'

const {
  game,
  myPlayer,
  isHost,
  serverSnapshot,
  phase,
  enqueueAction,
  resetRoomSession,
  myDeckSelection,
  isDeckReady,
  canEditDeckSelection,
  setReadyState,
} = useCrawlv3Controller()

const {
  statusDefinitions,
  statusLoading,
  statusError,
  catalogLoading,
  catalogCards,
  catalogError,
  configDraft,
  resetCatalogState,
  updateConfig,
  reloadCatalog,
  reloadStatuses,
} = useCrawlv3Catalog({
  game,
  serverSnapshot,
  phase,
  enqueueAction,
})

const catalogSearch = ref('')
const catalogCostFilter = ref('')
const catalogRaceFilter = ref('')
const catalogTypeFilter = ref('')
const catalogCategoryFilter = ref('')
const catalogSortField = ref<'default' | 'cost' | 'atk' | 'def'>('default')
const catalogSortDirection = ref<'asc' | 'desc'>('asc')
const selectionDirty = ref(false)
const localSelectionIds = ref<string[]>([])
const configExpanded = ref(false)
const catalogPreviewCard = ref<Crawlv3CatalogCard | null>(null)
const catalogTooltipCard = ref<Crawlv3CatalogCard | null>(null)
const catalogTooltipPoint = ref<{ x: number; y: number } | null>(null)

const canPreviewCatalogDraft = computed(() => {
  const config = configDraft.value
  return !!safeTrim(config?.csvUrl) && !!safeTrim(config?.headers?.id) && !!safeTrim(config?.headers?.title)
})

const selectedCatalogCounts = computed(() =>
  localSelectionIds.value.reduce<Record<string, number>>((counts, cardId) => {
    counts[cardId] = (counts[cardId] ?? 0) + 1
    return counts
  }, {}),
)

const selectedCatalogCards = computed(() => {
  const cardsById = new Map(catalogCards.value.map((card) => [card.id, card]))
  return localSelectionIds.value
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is Crawlv3CatalogCard => !!card)
})

const selectedCatalogRows = computed(() => {
  const counts = selectedCatalogCounts.value
  return catalogCards.value.map((card) => ({ card, count: counts[card.id] ?? 0 })).filter((row) => row.count > 0)
})

function splitCatalogValues(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function getUniqueCatalogOptions(getValues: (card: Crawlv3CatalogCard) => string[]) {
  return [...new Set(catalogCards.value.flatMap(getValues))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
}

const costFilterOptions = computed(() => getUniqueCatalogOptions((card) => [card.cost.trim()]))
const raceFilterOptions = computed(() => getUniqueCatalogOptions((card) => splitCatalogValues(card.race)))
const typeFilterOptions = computed(() => getUniqueCatalogOptions((card) => splitCatalogValues(card.damageType)))
const categoryFilterOptions = computed(() => getUniqueCatalogOptions((card) => splitCatalogValues(card.category)))
const costSelectOptions = computed(() => [
  { value: '', label: 'Any' },
  ...costFilterOptions.value.map((option) => ({ value: option, label: option })),
])
const raceSelectOptions = computed(() => [
  { value: '', label: 'Any' },
  ...raceFilterOptions.value.map((option) => ({ value: option, label: option })),
])
const typeSelectOptions = computed(() => [
  { value: '', label: 'Any' },
  ...typeFilterOptions.value.map((option) => ({ value: option, label: option })),
])
const categorySelectOptions = computed(() => [
  { value: '', label: 'Any' },
  ...categoryFilterOptions.value.map((option) => ({ value: option, label: option })),
])
const sortSelectOptions = [
  { value: 'default', label: 'Default' },
  { value: 'cost', label: 'Cost' },
  { value: 'atk', label: 'ATK' },
  { value: 'def', label: 'DEF' },
]
const sortDirectionOptions = [
  { value: 'asc', label: 'Increasing' },
  { value: 'desc', label: 'Decreasing' },
]

function getCatalogSearchRank(card: Crawlv3CatalogCard, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return 0
  if (card.title.toLowerCase().includes(normalizedQuery)) return 0
  if (card.id.toLowerCase().includes(normalizedQuery)) return 1
  if ([card.category, card.race, card.damageType].join(' ').toLowerCase().includes(normalizedQuery)) {
    return 2
  }
  if (card.description.toLowerCase().includes(normalizedQuery)) return 3
  return null
}

const filteredCatalogCards = computed(() => {
  const query = catalogSearch.value.trim().toLowerCase()
  const hasSearch = query.length > 0
  const sortField = catalogSortField.value

  return catalogCards.value
    .map((card, index) => ({ card, index, rank: hasSearch ? getCatalogSearchRank(card, query) : 0 }))
    .filter((result): result is { card: Crawlv3CatalogCard; index: number; rank: number } => result.rank !== null)
    .filter(({ card }) => {
      if (catalogCostFilter.value && card.cost.trim() !== catalogCostFilter.value) return false
      if (catalogRaceFilter.value && !splitCatalogValues(card.race).includes(catalogRaceFilter.value)) return false
      if (catalogTypeFilter.value && !splitCatalogValues(card.damageType).includes(catalogTypeFilter.value))
        return false
      if (catalogCategoryFilter.value && !splitCatalogValues(card.category).includes(catalogCategoryFilter.value)) {
        return false
      }
      return true
    })
    .sort((left, right) => {
      if (sortField !== 'default') {
        const direction = catalogSortDirection.value === 'asc' ? 1 : -1
        const leftValue = Number(left.card[sortField])
        const rightValue = Number(right.card[sortField])
        const leftSortable = Number.isFinite(leftValue) ? leftValue : Number.POSITIVE_INFINITY
        const rightSortable = Number.isFinite(rightValue) ? rightValue : Number.POSITIVE_INFINITY
        const result = leftSortable - rightSortable || left.card.title.localeCompare(right.card.title)
        if (result) return result * direction
      }

      return left.rank - right.rank || left.index - right.index
    })
    .map((result) => result.card)
})

const catalogPreviewState = computed(() => {
  const card = catalogPreviewCard.value
  if (!card) return null

  return createCatalogPreviewCardState(card, myPlayer.value ?? 'player1')
})

const canConfirmDeckSelection = computed(
  () =>
    !catalogLoading.value &&
    !!catalogCards.value.length &&
    !!localSelectionIds.value.length &&
    canEditDeckSelection.value,
)

const canReadyUp = computed(
  () => !!myDeckSelection.value && !isDeckReady.value && !selectionDirty.value && !!myDeckSelection.value.cards.length,
)

function resetLobbyCatalogState() {
  selectionDirty.value = false
  localSelectionIds.value = []
  configExpanded.value = false
  catalogPreviewCard.value = null
  catalogTooltipCard.value = null
  catalogTooltipPoint.value = null
}

function leaveRoom() {
  resetRoomSession()
  resetCatalogState()
  resetLobbyCatalogState()
}

function addCardSelection(cardId: string) {
  if (!canEditDeckSelection.value) return
  selectionDirty.value = true
  localSelectionIds.value = [...localSelectionIds.value, cardId]
}

function removeCardSelection(cardId: string) {
  if (!canEditDeckSelection.value) return
  const removeIndex = localSelectionIds.value.lastIndexOf(cardId)
  if (removeIndex === -1) return
  selectionDirty.value = true
  localSelectionIds.value = localSelectionIds.value.filter((_, index) => index !== removeIndex)
}

function confirmDeckSelection() {
  if (!canEditDeckSelection.value) return
  const confirmedIds = [...localSelectionIds.value]
  enqueueAction({
    type: 'select_deck',
    cards: selectedCatalogCards.value,
  })
  localSelectionIds.value = confirmedIds
  selectionDirty.value = false
}

function selectAllCatalogCards() {
  if (!canEditDeckSelection.value) return
  selectionDirty.value = true
  localSelectionIds.value = catalogCards.value.map((card) => card.id)
}

function clearCatalogSelection() {
  if (!canEditDeckSelection.value) return
  selectionDirty.value = true
  localSelectionIds.value = []
}

function clearCatalogSearch() {
  catalogSearch.value = ''
}

function updateCatalogTooltip(card: Crawlv3CatalogCard, event: MouseEvent) {
  catalogTooltipCard.value = card
  catalogTooltipPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }
}

function clearCatalogTooltip(card?: Crawlv3CatalogCard) {
  if (!card || catalogTooltipCard.value?.id === card.id) {
    catalogTooltipCard.value = null
    catalogTooltipPoint.value = null
  }
}

function getSelectedCardSubtext(card: Crawlv3CatalogCard) {
  return [`Cost ${card.cost || '-'}`, getCardTags(card)].filter(Boolean).join(' | ')
}

watch(
  () => JSON.stringify(myDeckSelection.value?.cards.map((card) => card.id) ?? []),
  (serializedSelection) => {
    if (selectionDirty.value) return
    const nextIds = serializedSelection ? (JSON.parse(serializedSelection) as string[]) : []
    localSelectionIds.value = nextIds
  },
  { immediate: true },
)

const catalogHeaderFields: [keyof Crawlv3CatalogConfig['headers'], string][] = [
  ['id', 'ID header'],
  ['title', 'Title header'],
  ['cost', 'Cost header'],
  ['atk', 'ATK header'],
  ['def', 'DEF header'],
  ['category', 'Category header'],
  ['race', 'Race header'],
  ['damageType', 'Damage type header'],
  ['img', 'Image header'],
  ['description', 'Description header'],
]

const statusHeaderFields: [keyof Crawlv3CatalogConfig['statusHeaders'], string][] = [
  ['id', 'Status id header'],
  ['name', 'Status name header'],
  ['type', 'Status type header'],
  ['description', 'Status description header'],
]
</script>

<template>
  <div class="mx-auto max-w-[100rem] py-8">
    <div class="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)_minmax(16rem,19rem)]">
      <aside class="space-y-6">
        <section class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-6 shadow-2xl backdrop-blur-sm">
          <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Room</p>
          <div class="mt-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-sm text-white/55">Code</p>
              <p class="text-4xl font-semibold tracking-[0.22em] text-amber-200">{{ game?.code }}</p>
            </div>
            <button
              type="button"
              class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
              @click="leaveRoom"
            >
              Leave
            </button>
          </div>

          <div class="mt-6 space-y-3">
            <div
              v-for="playerKey in ['player1', 'player2'] as const"
              :key="playerKey"
              class="rounded-[1.25rem] border px-4 py-4"
              :class="playerKey === myPlayer ? 'border-amber-300/45 bg-amber-300/10' : 'border-white/10 bg-white/5'"
            >
              <p class="text-xs font-semibold tracking-[0.25em] text-white/40 uppercase">
                {{ playerKey === 'player1' ? 'Host' : 'Player 2' }}
              </p>
              <p class="mt-2 text-lg font-semibold">
                {{ game?.players[playerKey]?.username ?? 'Waiting for player...' }}
              </p>
              <p class="mt-1 text-sm text-white/55">
                {{
                  game?.deckSelections[playerKey]?.ready
                    ? 'Ready'
                    : game?.deckSelections[playerKey]
                      ? `${game.deckSelections[playerKey]?.cards.length} cards selected`
                      : 'No deck selected yet'
                }}
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-6 shadow-2xl backdrop-blur-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Catalog Setup</p>
              <h2 class="mt-2 text-2xl font-semibold">CSV + Images</h2>
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                @click="configExpanded = !configExpanded"
              >
                {{ configExpanded ? 'Hide Config' : 'Show Config' }}
              </button>
              <button
                v-if="isHost && configExpanded"
                type="button"
                class="cursor-pointer rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
                @click="updateConfig"
              >
                Save Config
              </button>
            </div>
          </div>

          <div
            v-if="!configExpanded"
            class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-white/60"
          >
            Room config is collapsed by default. Expand it to edit the card CSV, image links, status CSV, and default
            point values.
          </div>

          <div v-else class="mt-5 space-y-4">
            <label class="block">
              <span class="mb-2 block text-sm text-white/65">Card CSV URL</span>
              <input
                v-model="configDraft.csvUrl"
                :readonly="!isHost"
                type="url"
                placeholder="https://example.com/cards.csv"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
              />
            </label>

            <div class="grid gap-3 sm:grid-cols-2">
              <label v-for="[key, label] in catalogHeaderFields" :key="key" class="block">
                <span class="mb-2 block text-sm text-white/65">{{ label }}</span>
                <input
                  v-model="configDraft.headers[key]"
                  :readonly="!isHost"
                  type="text"
                  :placeholder="key"
                  class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
                />
              </label>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm text-white/65">Image URL template</span>
              <input
                v-model="configDraft.imageUrlTemplate"
                :readonly="!isHost"
                type="text"
                placeholder="https://cdn.example.com/cards/{id}.png"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
              />
              <span class="mt-2 block text-xs text-white/45">
                Use <code>{id}</code> where the card id should be inserted.
              </span>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm text-white/65">Per-id image overrides</span>
              <textarea
                v-model="configDraft.imageOverridesText"
                :readonly="!isHost"
                rows="5"
                placeholder="123,https://cdn.example.com/cards/123.png"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm text-white/65">Field image URL</span>
              <input
                v-model="configDraft.fieldImageUrl"
                :readonly="!isHost"
                type="url"
                placeholder="https://cdn.example.com/field.png"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
              />
            </label>

            <div class="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-white/88">Buff / Debuff CSV</p>
                  <p class="mt-1 text-sm text-white/55">
                    Optional CSV with <code>id</code>, <code>name</code>, <code>type</code>, and
                    <code>description</code> columns.
                  </p>
                </div>
                <p class="text-sm text-white/55">
                  {{ statusLoading ? 'Loading status list...' : `${statusDefinitions.length} status entries ready` }}
                </p>
              </div>

              <div class="mt-4 space-y-4">
                <label class="block">
                  <span class="mb-2 block text-sm text-white/65">Status CSV URL</span>
                  <input
                    v-model="configDraft.statusCsvUrl"
                    :readonly="!isHost"
                    type="url"
                    placeholder="https://example.com/statuses.csv"
                    class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
                  />
                </label>

                <div class="grid gap-3 sm:grid-cols-2">
                  <label v-for="[key, label] in statusHeaderFields" :key="key" class="block">
                    <span class="mb-2 block text-sm text-white/65">{{ label }}</span>
                    <input
                      v-model="configDraft.statusHeaders[key]"
                      :readonly="!isHost"
                      type="text"
                      :placeholder="key"
                      class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm text-white/65">Default hit points</span>
                <input
                  v-model.number="configDraft.defaultLifePoints"
                  :readonly="!isHost"
                  type="number"
                  class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
                />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm text-white/65">Default action points</span>
                <input
                  v-model.number="configDraft.defaultActionPoints"
                  :readonly="!isHost"
                  type="number"
                  class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
                />
              </label>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm text-white/65">Extra deck categories</span>
              <input
                v-model="configDraft.extraDeckCategoriesText"
                :readonly="!isHost"
                type="text"
                placeholder="Fusion Unit, Ritual Unit"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm text-white/65">Face-down table categories</span>
              <input
                v-model="configDraft.faceDownCategoriesText"
                :readonly="!isHost"
                type="text"
                placeholder="Trap"
                class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
              />
            </label>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canPreviewCatalogDraft || catalogLoading"
                @click="reloadCatalog(configDraft)"
              >
                {{ catalogLoading ? 'Loading...' : 'Preview Catalog' }}
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                @click="reloadStatuses(configDraft)"
              >
                Preview Status List
              </button>
              <p v-if="catalogCards.length" class="self-center text-sm text-emerald-200">
                {{ catalogCards.length }} cards loaded
              </p>
            </div>

            <div class="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Status Preview</p>
                  <p class="mt-1 text-sm text-white/55">
                    {{ statusLoading ? 'Loading status list...' : `${statusDefinitions.length} status names` }}
                  </p>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="status in statusDefinitions"
                  :key="`status-preview-${status.id}`"
                  class="group relative rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/80"
                >
                  {{ status.name || status.id }}
                  <span
                    v-if="status.description"
                    class="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-xl border border-white/10 bg-neutral-950/95 p-3 text-left text-xs leading-relaxed font-medium text-white/80 shadow-2xl group-hover:block"
                  >
                    {{ status.description }}
                  </span>
                </span>
              </div>

              <p v-if="statusError" class="mt-3 text-sm text-rose-300">{{ statusError }}</p>
            </div>

            <p v-if="catalogError" class="text-sm text-rose-300">{{ catalogError }}</p>
          </div>
        </section>
      </aside>

      <section class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-6 shadow-2xl backdrop-blur-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Deck Selection</p>
            <h2 class="mt-2 text-2xl font-semibold">Pick Starting Cards</h2>
            <p class="mt-2 text-white/60">
              Choose any number of cards, confirm your selection, then ready up once you are happy.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canEditDeckSelection"
              @click="selectAllCatalogCards"
            >
              Select All
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canEditDeckSelection"
              @click="clearCatalogSelection"
            >
              Clear Selection
            </button>
            <button
              v-if="!isDeckReady"
              type="button"
              class="cursor-pointer rounded-full border border-sky-300/35 bg-sky-300/15 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-300/20 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canConfirmDeckSelection"
              @click="confirmDeckSelection"
            >
              Confirm Selection
            </button>
            <button
              v-if="myDeckSelection && !isDeckReady"
              type="button"
              class="cursor-pointer rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canReadyUp"
              @click="setReadyState(true)"
            >
              Ready Up
            </button>
            <button
              v-if="myDeckSelection && isDeckReady"
              type="button"
              class="cursor-pointer rounded-full border border-rose-300/35 bg-rose-300/15 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-300/20"
              @click="setReadyState(false)"
            >
              Unready
            </button>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <input
            v-model="catalogSearch"
            type="text"
            placeholder="Search cards"
            class="min-w-[16rem] flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 transition outline-none focus:border-amber-300/50"
          />
          <button
            type="button"
            class="cursor-pointer rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!catalogSearch"
            @click="clearCatalogSearch"
          >
            Clear
          </button>
          <div class="inline-flex items-center rounded-full bg-white/5 px-4 py-3 text-sm text-white/70">
            {{ localSelectionIds.length }} selected
          </div>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label class="block">
            <span class="mb-2 block text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">Cost</span>
            <CrawlV3Select v-model="catalogCostFilter" :options="costSelectOptions" />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">Race</span>
            <CrawlV3Select v-model="catalogRaceFilter" :options="raceSelectOptions" />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">Type</span>
            <CrawlV3Select v-model="catalogTypeFilter" :options="typeSelectOptions" />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">Category</span>
            <CrawlV3Select v-model="catalogCategoryFilter" :options="categorySelectOptions" />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">Sort</span>
            <CrawlV3Select v-model="catalogSortField" :options="sortSelectOptions" />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">Direction</span>
            <CrawlV3Select
              v-model="catalogSortDirection"
              :options="sortDirectionOptions"
              :disabled="catalogSortField === 'default'"
            />
          </label>
        </div>

        <div
          v-if="catalogLoading && !catalogCards.length"
          class="mt-8 rounded-[1.25rem] border border-white/10 bg-white/5 p-8 text-center text-white/65"
        >
          Loading catalog...
        </div>

        <div
          v-else-if="!catalogCards.length"
          class="mt-8 rounded-[1.25rem] border border-white/10 bg-white/5 p-8 text-center text-white/65"
        >
          Save the catalog config and load the CSV to start picking cards.
        </div>

        <div v-else class="mt-8 max-h-[clamp(34rem,58vw,56rem)] overflow-y-auto pr-2">
          <div class="grid [grid-template-columns:repeat(auto-fill,minmax(11rem,1fr))] gap-4">
            <div
              v-for="(card, cardIndex) in filteredCatalogCards"
              :key="`catalog-${card.id}-${cardIndex}`"
              class="relative overflow-hidden rounded-[1.4rem] border bg-white/5 transition"
              :class="
                selectedCatalogCounts[card.id]
                  ? 'border-amber-300/50 bg-amber-300/10'
                  : 'border-white/10 hover:border-white/25 hover:bg-white/10'
              "
              :aria-disabled="!canEditDeckSelection"
              @contextmenu.prevent.stop="catalogPreviewCard = card"
              @mouseenter="updateCatalogTooltip(card, $event)"
              @mousemove="updateCatalogTooltip(card, $event)"
              @mouseleave="clearCatalogTooltip(card)"
            >
              <button
                type="button"
                class="block w-full cursor-pointer text-left disabled:cursor-not-allowed"
                :disabled="!canEditDeckSelection"
                :aria-label="canEditDeckSelection ? `Add ${card.title}` : 'Unready to change your selection'"
                @click="addCardSelection(card.id)"
              >
                <div class="relative aspect-[63/88] overflow-hidden bg-transparent">
                  <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.title" class="h-full w-full object-cover" />
                  <div
                    v-else
                    class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7e6c0_0%,#ddc48f_35%,#7b5f31_100%)] p-3 text-center text-sm font-semibold text-amber-950"
                  >
                    {{ card.title }}
                  </div>
                </div>

                <div class="p-3">
                  <div class="min-w-0">
                    <p class="truncate font-semibold">{{ card.title }}</p>
                    <p v-if="getCardTags(card)" class="mt-1 text-xs text-white/50">{{ getCardTags(card) }}</p>
                  </div>
                </div>
              </button>

              <button
                v-if="selectedCatalogCounts[card.id]"
                type="button"
                class="absolute top-2 right-2 cursor-pointer rounded-full bg-amber-300 px-2.5 py-1 text-[0.7rem] font-semibold text-amber-950 shadow-lg transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canEditDeckSelection"
                :aria-label="`Remove one ${card.title}`"
                @click.stop="removeCardSelection(card.id)"
              >
                Selected x{{ selectedCatalogCounts[card.id] }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside
        class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Selected</p>
            <h2 class="mt-2 text-2xl font-semibold">Your Deck</h2>
            <p class="mt-1 text-sm text-white/60">{{ localSelectionIds.length }} cards</p>
          </div>
          <button
            type="button"
            class="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canEditDeckSelection || !localSelectionIds.length"
            @click="clearCatalogSelection"
          >
            Clear Selection
          </button>
        </div>

        <div
          v-if="!selectedCatalogRows.length"
          class="mt-4 rounded-[1rem] border border-white/10 bg-white/5 p-4 text-sm text-white/50"
        >
          No cards selected.
        </div>

        <div v-else class="mt-4 space-y-2">
          <button
            v-for="{ card, count } in selectedCatalogRows"
            :key="`selected-${card.id}`"
            type="button"
            class="flex w-full items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 p-2 text-left transition hover:border-rose-300/35 hover:bg-rose-300/10"
            :class="canEditDeckSelection ? 'cursor-pointer' : 'cursor-default opacity-70'"
            :aria-disabled="!canEditDeckSelection"
            :aria-label="`Remove one ${card.title}`"
            @click="canEditDeckSelection && removeCardSelection(card.id)"
            @contextmenu.prevent.stop="catalogPreviewCard = card"
          >
            <div class="h-14 w-10 shrink-0 overflow-hidden border border-white/10 bg-transparent">
              <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.title" class="h-full w-full object-cover" />
              <div
                v-else
                class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7e6c0_0%,#ddc48f_35%,#7b5f31_100%)] text-[0.55rem] font-semibold text-amber-950"
              >
                {{ card.title.slice(0, 2) }}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-white/90">{{ card.title }}</p>
              <p class="mt-0.5 truncate text-xs text-white/45">{{ getSelectedCardSubtext(card) }}</p>
            </div>
            <span class="rounded-full bg-amber-300 px-2 py-1 text-xs font-semibold text-amber-950"> x{{ count }} </span>
          </button>
        </div>
      </aside>
    </div>

    <CrawlV3CatalogTooltip :card="catalogTooltipCard" :point="catalogTooltipPoint" />

    <CrawlV3CardPreviewModal
      v-if="catalogPreviewState"
      :card="catalogPreviewState"
      :show-face="true"
      @close="catalogPreviewCard = null"
    />
  </div>
</template>
