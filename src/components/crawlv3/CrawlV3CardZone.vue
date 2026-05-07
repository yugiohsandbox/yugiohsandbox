<script setup lang="ts">
import CrawlV3Card from '@/components/crawlv3/CrawlV3Card.vue'
import type { Crawlv3CardState, Crawlv3Player, Crawlv3StatusType, Crawlv3Zone } from '@/types/crawlv3'

withDefaults(
  defineProps<{
    cards: Crawlv3CardState[]
    dropZone: Crawlv3Zone
    owner?: Crawlv3Player
    emptyLabel: string
    zoneClass: string
    selectedCardId?: string | null
    statusLabels?: Record<string, string>
    showGrid?: boolean
    cardPositionStyle: (card: Crawlv3CardState) => Record<string, string>
    getCardRenderFace: (card: Crawlv3CardState) => boolean
  }>(),
  {
    owner: undefined,
    selectedCardId: null,
    statusLabels: () => ({}),
    showGrid: false,
  },
)

const emit = defineEmits<{
  (e: 'card-pointerdown', card: Crawlv3CardState, event: PointerEvent): void
  (e: 'card-preview', instanceId: string): void
  (e: 'card-tooltip', card: Crawlv3CardState, event: MouseEvent): void
  (e: 'card-tooltip-clear', card: Crawlv3CardState): void
  (e: 'decrement-status', instanceId: string, kind: Crawlv3StatusType, key: string): void
}>()
</script>

<template>
  <div :class="zoneClass" :data-crawlv3-drop-zone="dropZone" :data-crawlv3-owner="owner">
    <div
      v-if="showGrid"
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:calc(100%/10)_calc(100%/8)]"
    />

    <p v-if="!cards.length" class="p-5 text-sm text-white/35">{{ emptyLabel }}</p>

    <div v-for="card in cards" :key="card.instanceId" class="absolute" :style="cardPositionStyle(card)">
      <CrawlV3Card
        :card="card"
        fill-parent
        :show-face="getCardRenderFace(card)"
        :selected="selectedCardId === card.instanceId"
        :status-labels="statusLabels"
        @pointerdown="emit('card-pointerdown', card, $event)"
        @contextmenu.prevent="emit('card-preview', card.instanceId)"
        @mouseenter="emit('card-tooltip', card, $event)"
        @mousemove="emit('card-tooltip', card, $event)"
        @mouseleave="emit('card-tooltip-clear', card)"
        @decrement-status="emit('decrement-status', card.instanceId, $event.kind, $event.key)"
      />
    </div>
  </div>
</template>
