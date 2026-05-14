<script setup lang="ts">
import type { Crawlv3Game, Crawlv3Player } from '@/types/crawlv3'

defineProps<{
  game: Crawlv3Game | null
  myPlayer: Crawlv3Player | null
}>()

defineEmits<{
  (event: 'leave'): void
}>()

const playerKeys: Crawlv3Player[] = ['player1', 'player2']
</script>

<template>
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
        @click="$emit('leave')"
      >
        Leave
      </button>
    </div>

    <div class="mt-6 space-y-3">
      <div
        v-for="playerKey in playerKeys"
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

    <div class="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
      <p class="text-xs font-semibold tracking-[0.25em] text-white/40 uppercase">Spectators</p>
      <div v-if="game?.spectators.length" class="mt-3 space-y-2">
        <p
          v-for="spectator in game.spectators"
          :key="spectator.uid"
          class="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75"
        >
          {{ spectator.username }}
        </p>
      </div>
      <p v-else class="mt-3 text-sm text-white/45">No spectators yet.</p>
    </div>
  </section>
</template>
