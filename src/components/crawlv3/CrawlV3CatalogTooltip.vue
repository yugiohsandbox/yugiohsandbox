<script setup lang="ts">
import { computed } from 'vue'

import { getCardTags, hasDisplayValue } from '@/lib/crawlv3/card-display'
import type { Crawlv3CatalogCard } from '@/types/crawlv3'

const props = defineProps<{
  card: Crawlv3CatalogCard | null
  point: { x: number; y: number } | null
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
      <p v-if="hasDisplayValue(card.category)" class="mt-1 text-white/60">
        {{ card.category }}
      </p>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-white/55">
        <span v-if="hasDisplayValue(card.cost)"
          >Cost <span class="text-white">{{ card.cost }}</span></span
        >
        <span v-if="hasDisplayValue(card.atk)"
          >ATK <span class="text-base font-bold text-white">{{ card.atk }}</span></span
        >
        <span v-if="hasDisplayValue(card.def)"
          >DEF <span class="text-base font-bold text-white">{{ card.def }}</span></span
        >
      </div>
      <p v-if="getCardTags(card)" class="mt-1 text-white/55">{{ getCardTags(card) }}</p>
      <p class="mt-3 whitespace-pre-wrap text-white/82">
        {{ card.description || 'No description provided.' }}
      </p>
    </div>
  </Teleport>
</template>
