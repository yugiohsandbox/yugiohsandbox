<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'create'): void
  (e: 'join'): void
}>()

const joinCode = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
    <div
      class="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 shadow-2xl backdrop-blur-sm"
    >
      <p class="text-xs font-semibold tracking-[0.45em] text-amber-200/60 uppercase">CrawlV3</p>
      <h1 class="mt-4 text-4xl font-semibold text-white">Sandbox Multiplayer</h1>
      <p class="mt-3 max-w-xl text-white/65">
        Create a room, load your card CSV, pick any number of starting cards, and manipulate the sandbox together in
        real time.
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          v-model="joinCode"
          type="number"
          placeholder="Enter room code"
          class="rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-4 text-lg transition outline-none focus:border-amber-300/50"
          @keyup.enter="emit('join')"
        />
        <button
          type="button"
          class="cursor-pointer rounded-[1.25rem] border border-sky-300/40 bg-sky-300/15 px-6 py-4 text-lg font-semibold text-sky-100 transition hover:border-sky-300/60 hover:bg-sky-300/20 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || !joinCode"
          @click="emit('join')"
        >
          Join
        </button>
      </div>

      <div class="my-8 flex items-center gap-4 text-sm text-white/35">
        <div class="h-px flex-1 bg-white/10" />
        <span>or</span>
        <div class="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        class="w-full cursor-pointer rounded-[1.25rem] bg-amber-300 px-6 py-4 text-lg font-semibold text-amber-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading"
        @click="emit('create')"
      >
        Create Room
      </button>

      <p v-if="error" class="mt-4 text-sm text-rose-300">{{ error }}</p>
    </div>
  </div>
</template>
