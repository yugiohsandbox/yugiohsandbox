<script setup lang="ts">
import { computed } from 'vue'

import { formatDisplayValue, getCardTags, hasDisplayValue, shouldShowCardStat } from '@/lib/crawlv3/card-display'
import type { Crawlv3CardState, Crawlv3StatusType } from '@/types/crawlv3'

type CardStatusEntry = {
  id: string
  name: string
  description: string
  type: Crawlv3StatusType
  value: number
}

const props = defineProps<{
  card: Crawlv3CardState | null
  point: { x: number; y: number } | null
  buffs: CardStatusEntry[]
  debuffs: CardStatusEntry[]
}>()

const tooltipStyle = computed(() => {
  if (!props.point) return {}

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0

  return {
    left: `${Math.min(props.point.x + 18, Math.max(0, viewportWidth - 360))}px`,
    top: `${Math.min(props.point.y + 18, Math.max(0, viewportHeight - 260))}px`,
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="card && point"
      class="pointer-events-none fixed z-[1000] max-w-sm rounded-[1.25rem] border border-white/10 bg-neutral-950/95 p-4 text-sm text-white shadow-2xl backdrop-blur-sm"
      :style="tooltipStyle"
    >
      <h3 class="text-lg font-semibold">{{ card.title }}</h3>
      <p v-if="hasDisplayValue(card.category)" class="mt-1 text-white/60">{{ card.category }}</p>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-white/55">
        <span v-if="hasDisplayValue(card.cost)"
          >Cost <span class="text-white">{{ card.cost }}</span></span
        >
        <span v-if="shouldShowCardStat(card, 'atk')"
          >ATK <span class="text-base font-bold text-white">{{ formatDisplayValue(card.atk) }}</span></span
        >
        <span v-if="shouldShowCardStat(card, 'def')"
          >DEF <span class="text-base font-bold text-white">{{ formatDisplayValue(card.def) }}</span></span
        >
      </div>
      <p v-if="getCardTags(card)" class="mt-1 text-white/55">{{ getCardTags(card) }}</p>
      <p class="mt-3 whitespace-pre-wrap text-white/82">
        {{ card.description || 'No description provided.' }}
      </p>

      <div v-if="buffs.length || debuffs.length" class="mt-4 space-y-3">
        <div v-if="buffs.length">
          <p class="text-xs font-semibold tracking-[0.25em] text-emerald-200/80 uppercase">Buffs</p>
          <div class="mt-2 space-y-2">
            <div v-for="status in buffs" :key="`tooltip-buff-${status.id}`" class="text-white/80">
              <p class="font-semibold text-emerald-200">{{ status.name }} {{ status.value }}</p>
              <p v-if="status.description" class="text-xs text-white/55">{{ status.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="debuffs.length">
          <p class="text-xs font-semibold tracking-[0.25em] text-rose-200/80 uppercase">Debuffs</p>
          <div class="mt-2 space-y-2">
            <div v-for="status in debuffs" :key="`tooltip-debuff-${status.id}`" class="text-white/80">
              <p class="font-semibold text-rose-200">{{ status.name }} {{ status.value }}</p>
              <p v-if="status.description" class="text-xs text-white/55">{{ status.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
