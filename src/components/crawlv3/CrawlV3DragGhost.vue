<script setup lang="ts">
import CrawlV3Card from '@/components/crawlv3/CrawlV3Card.vue'
import type { Crawlv3CardState } from '@/types/crawlv3'

defineProps<{
  card: Crawlv3CardState
  style: Record<string, string | undefined>
  showFace: boolean
  statusLabels: Record<string, string>
}>()
</script>

<template>
  <div class="pointer-events-none fixed z-[999]" :style="style">
    <CrawlV3Card :card="card" fill-parent :show-face="showFace" :status-labels="statusLabels" ghosted />
  </div>
</template>
