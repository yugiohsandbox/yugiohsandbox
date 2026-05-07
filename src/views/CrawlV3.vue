<script setup lang="ts">
import CrawlV3GamePhase from '@/components/crawlv3/CrawlV3GamePhase.vue'
import CrawlV3JoinPanel from '@/components/crawlv3/CrawlV3JoinPanel.vue'
import CrawlV3LobbyPhase from '@/components/crawlv3/CrawlV3LobbyPhase.vue'
import { useCrawlv3Controller } from '@/composables/crawlv3/useCrawlv3Controller'

const { joinCode, loading, error, phase, createGame, joinGame } = useCrawlv3Controller()
</script>

<template>
  <div
    class="min-h-screen bg-[radial-gradient(circle_at_top,#3a1c12_0%,#18110f_40%,#090909_100%)] px-4 pb-12 text-white sm:px-6"
    :style="{ '--crawlv3-card-width': 'clamp(5.3rem, 7.2vw, 8.2rem)' }"
  >
    <CrawlV3JoinPanel
      v-if="phase === 'join'"
      v-model="joinCode"
      :loading="loading"
      :error="error"
      @create="createGame"
      @join="joinGame"
    />

    <CrawlV3LobbyPhase v-else-if="phase === 'lobby'" />

    <CrawlV3GamePhase v-else-if="phase === 'game'" />

    <p
      v-if="error"
      class="fixed right-4 bottom-4 z-[1000] rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-2xl"
    >
      {{ error }}
    </p>
  </div>
</template>
