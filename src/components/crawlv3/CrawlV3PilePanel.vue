<script setup lang="ts">
import type { Crawlv3Player } from '@/types/crawlv3'
import type { Crawlv3PileZone } from '@/types/crawlv3-ui'

defineProps<{
  title: string
  zone: Crawlv3PileZone
  owner: Crawlv3Player
  count: number
  cardBackImage: string
  topImage?: string
  interactive?: boolean
  canInspect?: boolean
  orderClass?: string
  actions?: 'draw' | 'spent'
}>()

defineEmits<{
  (event: 'open', zone: Crawlv3PileZone): void
  (event: 'drag', zone: Crawlv3PileZone, pointerEvent: PointerEvent): void
  (event: 'draw'): void
  (event: 'shuffle'): void
  (event: 'shuffle-spent'): void
}>()

const emptyLabels: Record<Crawlv3PileZone, string> = {
  deck: 'Draw',
  extraDeck: 'Extra Deck',
  discard: 'Spent',
  exhausted: 'Exhausted',
}

const imageAlts: Record<Crawlv3PileZone, string> = {
  deck: 'Draw pile',
  extraDeck: 'Extra deck pile',
  discard: 'Spent pile',
  exhausted: 'Exhausted pile',
}

const buttonClasses = {
  hand: 'cursor-pointer rounded-full border border-sky-300/35 bg-sky-300/15 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/55 hover:bg-sky-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  deck: 'cursor-pointer rounded-full border border-indigo-300/35 bg-indigo-300/15 px-3 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-300/55 hover:bg-indigo-300/25 disabled:cursor-not-allowed disabled:opacity-50',
  neutral:
    'cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5',
} as const

const stackedZones = new Set<Crawlv3PileZone>(['deck', 'extraDeck'])
</script>

<template>
  <div
    class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
    :class="orderClass"
    :data-crawlv3-drop-zone="zone"
    :data-crawlv3-owner="owner"
    @contextmenu.prevent="canInspect && $emit('open', zone)"
  >
    <div>
      <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">{{ title }}</p>
    </div>

    <div class="mt-4 flex items-center gap-4">
      <div
        :class="[
          'relative h-28 w-20',
          !stackedZones.has(zone) ? 'overflow-hidden border border-white/10 bg-transparent shadow-lg' : '',
          interactive ? 'cursor-pointer' : 'cursor-default',
        ]"
        @pointerdown="interactive && $emit('drag', zone, $event)"
        @dragstart.prevent
      >
        <template v-if="stackedZones.has(zone)">
          <div v-if="!count" class="absolute inset-0 border border-dashed border-white/10 bg-white/5" />
          <img
            v-for="depth in Math.min(count, 3)"
            :key="depth"
            :src="cardBackImage"
            :alt="imageAlts[zone]"
            draggable="false"
            class="absolute inset-0 h-full w-full border border-white/10 object-cover shadow-lg"
            :style="{ transform: `translate(${(depth - 1) * 5}px, ${(depth - 1) * 3}px)` }"
          />
        </template>

        <template v-else>
          <img
            v-if="topImage"
            :src="topImage"
            :alt="imageAlts[zone]"
            draggable="false"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7e6c0_0%,#ddc48f_35%,#7b5f31_100%)] p-3 text-center text-xs font-semibold text-amber-950"
          >
            {{ emptyLabels[zone] }}
          </div>
        </template>
      </div>

      <div>
        <p class="text-2xl font-semibold">{{ count }}</p>
      </div>
    </div>

    <div v-if="interactive && actions === 'spent'" class="mt-4">
      <button type="button" :class="buttonClasses.deck" :disabled="!count" @click="$emit('shuffle-spent')">
        Shuffle Into Draw
      </button>
    </div>

    <div v-if="interactive && actions === 'draw'" class="mt-4 flex flex-wrap gap-2">
      <button type="button" :class="buttonClasses.hand" @click="$emit('draw')">Draw Card</button>
      <button type="button" :class="buttonClasses.neutral" @click="$emit('shuffle')">Shuffle</button>
    </div>
  </div>
</template>
