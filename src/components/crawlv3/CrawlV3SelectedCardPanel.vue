<script setup lang="ts">
import CrawlV3Card from '@/components/crawlv3/CrawlV3Card.vue'
import CrawlV3Select from '@/components/crawlv3/CrawlV3Select.vue'
import { formatFaceLabel, formatPositionLabel, formatZoneLabel, shouldShowCardStat } from '@/lib/crawlv3/card-display'
import type { Crawlv3CardState, Crawlv3Zone } from '@/types/crawlv3'
import type { Crawlv3CardStatusEntry } from '@/types/crawlv3-ui'

const selectedAtk = defineModel<string>('selectedAtk', { required: true })
const selectedDef = defineModel<string>('selectedDef', { required: true })
const selectedRace = defineModel<string>('selectedRace', { required: true })
const selectedDamageType = defineModel<string>('selectedDamageType', { required: true })
const focusedSelectedStat = defineModel<'atk' | 'def' | null>('focusedSelectedStat', { required: true })
const moveMode = defineModel<boolean>('moveMode', { required: true })

defineProps<{
  selectedOwnCard: Crawlv3CardState | null
  selectedOwnCardPreview: Crawlv3CardState | null
  selectedCard: Crawlv3CardState | null
  selectedCardPreview: Crawlv3CardState | null
  selectedReadonlyShowFace: boolean
  isSpectator: boolean
  statusLabels: Record<string, string>
  raceOptions: { value: string; label: string }[]
  damageTypeOptions: { value: string; label: string }[]
  getStatusEntries: (card: Crawlv3CardState, kind: 'buff' | 'debuff') => Crawlv3CardStatusEntry[]
}>()

defineEmits<{
  (event: 'preview', cardId: string): void
  (event: 'decrement-status', cardId: string, kind: 'buff' | 'debuff', key: string): void
  (event: 'increment-status', cardId: string, kind: 'buff' | 'debuff', key: string): void
  (event: 'save-stat', stat: 'atk' | 'def'): void
  (event: 'blur-stat', stat: 'atk' | 'def'): void
  (event: 'save-detail', detail: 'race' | 'damageType'): void
  (event: 'toggle-face'): void
  (event: 'toggle-rotation'): void
  (event: 'edit-statuses', cardId: string): void
  (event: 'move-card', zone: Crawlv3Zone): void
}>()

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
  discard:
    'cursor-pointer rounded-full border border-rose-300/35 bg-rose-300/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300/55 hover:bg-rose-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  flip: 'cursor-pointer rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/55 hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  position:
    'cursor-pointer rounded-full border border-orange-300/35 bg-orange-300/15 px-3 py-2 text-sm font-semibold text-orange-100 transition hover:border-orange-300/55 hover:bg-orange-300/25 disabled:cursor-not-allowed disabled:opacity-50',
} as const

const readonlyInputClass =
  'w-full cursor-default rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-white/75 outline-none disabled:opacity-75'
</script>

<template>
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
          @contextmenu.prevent="$emit('preview', selectedOwnCard.instanceId)"
          @mouseenter.stop
          @mousemove.stop
          @mouseleave.stop
          @decrement-status="$emit('decrement-status', selectedOwnCard.instanceId, $event.kind, $event.key)"
          @increment-status="$emit('increment-status', selectedOwnCard.instanceId, $event.kind, $event.key)"
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
            @keyup.enter="$emit('save-stat', 'atk')"
            @blur="$emit('blur-stat', 'atk')"
          />
        </label>
        <label v-if="shouldShowCardStat(selectedOwnCard, 'def')" class="block">
          <span class="mb-2 block text-sm text-white/60">DEF</span>
          <input
            v-model="selectedDef"
            type="text"
            class="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none focus:border-amber-300/50"
            @focus="focusedSelectedStat = 'def'"
            @keyup.enter="$emit('save-stat', 'def')"
            @blur="$emit('blur-stat', 'def')"
          />
        </label>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-2 block text-sm text-white/60">Race</span>
          <CrawlV3Select v-model="selectedRace" :options="raceOptions" @change="$emit('save-detail', 'race')" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm text-white/60">Type</span>
          <CrawlV3Select
            v-model="selectedDamageType"
            :options="damageTypeOptions"
            @change="$emit('save-detail', 'damageType')"
          />
        </label>
      </div>

      <div class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
        <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Description</p>
        <p class="mt-3 text-sm whitespace-pre-wrap text-white/78">
          {{ selectedOwnCard.description || 'No description provided.' }}
        </p>
      </div>

      <div v-if="!moveMode" class="mt-4 grid gap-2">
        <button
          v-if="selectedOwnCard.zone === 'table'"
          type="button"
          :class="[buttonClasses.flip, 'w-full']"
          @click="$emit('toggle-face')"
        >
          Flip card
        </button>
        <button
          v-if="selectedOwnCard.zone === 'table'"
          type="button"
          :class="[buttonClasses.position, 'w-full']"
          @click="$emit('toggle-rotation')"
        >
          Switch stance
        </button>
        <button
          type="button"
          class="w-full cursor-pointer rounded-full bg-amber-300 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
          @click="$emit('edit-statuses', selectedOwnCard.instanceId)"
        >
          Modifiers
        </button>
        <button type="button" :class="[buttonClasses.neutral, 'w-full']" @click="moveMode = true">Move</button>
      </div>

      <div v-else class="mt-4 grid gap-2">
        <button
          v-if="selectedOwnCard.zone !== 'hand'"
          type="button"
          :class="[buttonClasses.hand, 'w-full']"
          @click="$emit('move-card', 'hand')"
        >
          Hand
        </button>
        <button
          v-if="selectedOwnCard.zone !== 'table'"
          type="button"
          :class="[buttonClasses.table, 'w-full']"
          @click="$emit('move-card', 'table')"
        >
          Table
        </button>
        <button
          v-if="selectedOwnCard.zone !== 'exhausted'"
          type="button"
          :class="[buttonClasses.exhausted, 'w-full']"
          @click="$emit('move-card', 'exhausted')"
        >
          Exhausted
        </button>
        <button
          v-if="selectedOwnCard.zone !== 'discard'"
          type="button"
          :class="[buttonClasses.discard, 'w-full']"
          @click="$emit('move-card', 'discard')"
        >
          Spent
        </button>
        <button
          v-if="selectedOwnCard.zone !== 'extraDeck'"
          type="button"
          :class="[buttonClasses.extraDeck, 'w-full']"
          @click="$emit('move-card', 'extraDeck')"
        >
          Extra Deck
        </button>
        <button
          v-if="selectedOwnCard.zone !== 'deck'"
          type="button"
          :class="[buttonClasses.deck, 'w-full']"
          @click="$emit('move-card', 'deck')"
        >
          Draw
        </button>
        <button type="button" :class="[buttonClasses.neutral, 'w-full']" @click="moveMode = false">Cancel</button>
      </div>

      <div
        v-if="getStatusEntries(selectedOwnCard, 'buff').length || getStatusEntries(selectedOwnCard, 'debuff').length"
        class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
      >
        <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Statuses</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="status in getStatusEntries(selectedOwnCard, 'buff')"
            :key="`selected-buff-${status.id}`"
            class="rounded-full bg-emerald-400/85 px-2.5 py-1 text-xs font-semibold text-emerald-950"
          >
            {{ status.name }} {{ status.value }}
          </span>
          <span
            v-for="status in getStatusEntries(selectedOwnCard, 'debuff')"
            :key="`selected-debuff-${status.id}`"
            class="rounded-full bg-rose-400/85 px-2.5 py-1 text-xs font-semibold text-rose-950"
          >
            {{ status.name }} {{ status.value }}
          </span>
        </div>
      </div>
    </template>

    <template v-else-if="selectedCard">
      <div class="mt-4 flex justify-center">
        <CrawlV3Card
          :card="selectedCardPreview ?? selectedCard"
          :show-face="selectedReadonlyShowFace"
          :interactive="false"
          :status-labels="statusLabels"
          @contextmenu.prevent="$emit('preview', selectedCard.instanceId)"
          @mouseenter.stop
          @mousemove.stop
          @mouseleave.stop
        />
      </div>

      <h2 class="mt-4 text-2xl font-semibold">
        {{ selectedReadonlyShowFace ? selectedCard.title : 'Face-down card' }}
      </h2>
      <p class="mt-1 text-sm text-white/55">
        {{ formatZoneLabel(selectedCard.zone) }} Zone
        <template v-if="selectedReadonlyShowFace">
          | {{ formatFaceLabel(selectedCard.faceUp) }} | {{ formatPositionLabel(selectedCard.rotated) }}
        </template>
      </p>

      <div
        v-if="
          selectedReadonlyShowFace &&
          (shouldShowCardStat(selectedCard, 'atk') || shouldShowCardStat(selectedCard, 'def'))
        "
        class="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <label v-if="shouldShowCardStat(selectedCard, 'atk')" class="block">
          <span class="mb-2 block text-sm text-white/60">ATK</span>
          <input :value="selectedCard.atk" type="text" disabled :class="readonlyInputClass" />
        </label>
        <label v-if="shouldShowCardStat(selectedCard, 'def')" class="block">
          <span class="mb-2 block text-sm text-white/60">DEF</span>
          <input :value="selectedCard.def" type="text" disabled :class="readonlyInputClass" />
        </label>
      </div>

      <div v-if="selectedReadonlyShowFace" class="mt-4 grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-2 block text-sm text-white/60">Race</span>
          <input :value="selectedCard.race || 'No race'" type="text" disabled :class="readonlyInputClass" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm text-white/60">Type</span>
          <input :value="selectedCard.damageType || 'No type'" type="text" disabled :class="readonlyInputClass" />
        </label>
      </div>

      <div v-if="selectedReadonlyShowFace" class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
        <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Description</p>
        <p class="mt-3 text-sm whitespace-pre-wrap text-white/78">
          {{ selectedCard.description || 'No description provided.' }}
        </p>
      </div>

      <div
        v-if="
          selectedReadonlyShowFace &&
          (getStatusEntries(selectedCard, 'buff').length || getStatusEntries(selectedCard, 'debuff').length)
        "
        class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
      >
        <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Statuses</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="status in getStatusEntries(selectedCard, 'buff')"
            :key="`readonly-buff-${status.id}`"
            class="rounded-full bg-emerald-400/85 px-2.5 py-1 text-xs font-semibold text-emerald-950"
          >
            {{ status.name }} {{ status.value }}
          </span>
          <span
            v-for="status in getStatusEntries(selectedCard, 'debuff')"
            :key="`readonly-debuff-${status.id}`"
            class="rounded-full bg-rose-400/85 px-2.5 py-1 text-xs font-semibold text-rose-950"
          >
            {{ status.name }} {{ status.value }}
          </span>
        </div>
      </div>
    </template>

    <div v-else class="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 p-5 text-sm text-white/55">
      {{
        isSpectator
          ? 'Right-click cards or piles to inspect them. Spectators cannot move or edit cards.'
          : 'Select one of your cards or drag it around the sandbox to edit it here.'
      }}
    </div>
  </aside>
</template>
