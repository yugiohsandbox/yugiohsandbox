<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import CrawlV3Card from '@/components/crawlv3/CrawlV3Card.vue'
import type { Crawlv3CardState, Crawlv3Player, Crawlv3StatusType, Crawlv3Zone } from '@/types/crawlv3'

const props = withDefaults(
  defineProps<{
    cards: Crawlv3CardState[]
    dropZone: Crawlv3Zone
    owner?: Crawlv3Player
    emptyLabel: string
    zoneClass: string
    fieldImageUrl?: string
    matchFieldImageAspect?: boolean
    selectedCardId?: string | null
    statusLabels?: Record<string, string>
    showGrid?: boolean
    cardPositionStyle: (card: Crawlv3CardState) => Record<string, string>
    getCardRenderFace: (card: Crawlv3CardState) => boolean
  }>(),
  {
    owner: undefined,
    selectedCardId: null,
    fieldImageUrl: '',
    matchFieldImageAspect: false,
    statusLabels: () => ({}),
    showGrid: false,
  },
)

const fieldHeight = 'clamp(38rem, min(50vw, calc(100vh - 26rem)), 68rem)'
const fieldAspectRatio = ref('16 / 9')
const fieldAspectRatioValue = ref(16 / 9)
const zoneElement = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const emit = defineEmits<{
  (e: 'card-pointerdown', card: Crawlv3CardState, event: PointerEvent): void
  (e: 'card-preview', instanceId: string): void
  (e: 'card-tooltip', card: Crawlv3CardState, event: MouseEvent): void
  (e: 'card-tooltip-clear', card: Crawlv3CardState): void
  (e: 'decrement-status', instanceId: string, kind: Crawlv3StatusType, key: string): void
  (e: 'zone-pointerdown', zone: Crawlv3Zone, event: PointerEvent): void
  (e: 'zone-resize', size: { width: number; height: number }): void
}>()

const zoneStyle = computed(() =>
  props.matchFieldImageAspect
    ? {
        aspectRatio: fieldAspectRatio.value,
        marginInline: 'auto',
        maxHeight: fieldHeight,
        width: `min(100%, calc(${fieldHeight} * ${fieldAspectRatioValue.value}))`,
      }
    : undefined,
)

function handleFieldImageLoad(event: Event) {
  const image = event.target as HTMLImageElement | null
  if (!image?.naturalWidth || !image.naturalHeight) return
  fieldAspectRatio.value = `${image.naturalWidth} / ${image.naturalHeight}`
  fieldAspectRatioValue.value = image.naturalWidth / image.naturalHeight
  requestAnimationFrame(emitZoneSize)
}

function emitZoneSize() {
  const rect = zoneElement.value?.getBoundingClientRect()
  if (!rect?.width || !rect.height) return
  emit('zone-resize', {
    width: rect.width,
    height: rect.height,
  })
}

function handleZonePointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  if ((event.target as HTMLElement | null)?.closest('[data-crawlv3-card-shell]')) return
  emit('zone-pointerdown', props.dropZone, event)
}

onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !zoneElement.value) {
    emitZoneSize()
    return
  }

  resizeObserver = new ResizeObserver(() => {
    emitZoneSize()
  })
  resizeObserver.observe(zoneElement.value)
  emitZoneSize()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div
    ref="zoneElement"
    :class="zoneClass"
    :style="zoneStyle"
    :data-crawlv3-drop-zone="dropZone"
    :data-crawlv3-owner="owner"
    @pointerdown="handleZonePointerDown"
  >
    <img
      v-if="fieldImageUrl"
      :src="fieldImageUrl"
      alt=""
      class="pointer-events-none absolute inset-0 h-full w-full object-contain object-center"
      @load="handleFieldImageLoad"
    />

    <div
      v-if="showGrid"
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:calc(100%/10)_calc(100%/8)]"
    />

    <p v-if="!cards.length" class="p-5 text-sm text-white/35">{{ emptyLabel }}</p>

    <div
      v-for="card in cards"
      :key="card.instanceId"
      class="absolute"
      :style="cardPositionStyle(card)"
      data-crawlv3-card-shell
    >
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
