<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'

import type { Crawlv3CardState, Crawlv3StatusDefinition } from '@/types/crawlv3'

const props = defineProps<{
  card: Crawlv3CardState
  statusDefinitions: Crawlv3StatusDefinition[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { buffs: Record<string, number>; debuffs: Record<string, number> }): void
}>()

const localBuffs = reactive<Record<string, number>>({})
const localDebuffs = reactive<Record<string, number>>({})

const buffDefinitions = computed(() => {
  const definitions = props.statusDefinitions.filter((status) => status.type === 'buff')
  const definitionMap = new Map(definitions.map((status) => [status.id, status]))

  for (const id of Object.keys(props.card.buffs)) {
    if (!definitionMap.has(id)) {
      definitionMap.set(id, {
        id,
        name: id,
        type: 'buff',
        description: '',
      })
    }
  }

  return [...definitionMap.values()]
})

const debuffDefinitions = computed(() => {
  const definitions = props.statusDefinitions.filter((status) => status.type === 'debuff')
  const definitionMap = new Map(definitions.map((status) => [status.id, status]))

  for (const id of Object.keys(props.card.debuffs)) {
    if (!definitionMap.has(id)) {
      definitionMap.set(id, {
        id,
        name: id,
        type: 'debuff',
        description: '',
      })
    }
  }

  return [...definitionMap.values()]
})

function syncRecords() {
  for (const key of Object.keys(localBuffs)) {
    delete localBuffs[key]
  }
  for (const key of Object.keys(localDebuffs)) {
    delete localDebuffs[key]
  }

  for (const option of buffDefinitions.value) {
    localBuffs[option.id] = props.card.buffs[option.id] ?? 0
  }
  for (const option of debuffDefinitions.value) {
    localDebuffs[option.id] = props.card.debuffs[option.id] ?? 0
  }
}

function cleanRecord(record: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, Number(value)] as const)
      .filter(([, value]) => Number.isFinite(value) && value !== 0),
  )
}

function increment(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1
}

function decrement(record: Record<string, number>, key: string) {
  record[key] = Math.max(0, (record[key] ?? 0) - 1)
}

function clearValue(record: Record<string, number>, key: string) {
  record[key] = 0
}

function clearAllLocalStatuses() {
  for (const key of Object.keys(localBuffs)) {
    localBuffs[key] = 0
  }
  for (const key of Object.keys(localDebuffs)) {
    localDebuffs[key] = 0
  }
}

function saveLocalStatuses() {
  emit('save', {
    buffs: cleanRecord(localBuffs),
    debuffs: cleanRecord(localDebuffs),
  })
}

function getShortcutDigit(event: KeyboardEvent) {
  if (/^Digit\d$/.test(event.code)) return event.code.slice(5)
  if (/^Numpad\d$/.test(event.code)) return event.code.slice(6)
  return null
}

function digitToOptionIndex(digit: string) {
  return digit === '0' ? 9 : Number(digit) - 1
}

function stopModalShortcut(event: KeyboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

function handleModalKeydown(event: KeyboardEvent) {
  if (event.repeat) return

  const digit = getShortcutDigit(event)
  if (digit !== null) {
    stopModalShortcut(event)
    const optionIndex = digitToOptionIndex(digit)
    const option = event.shiftKey ? debuffDefinitions.value[optionIndex] : buffDefinitions.value[optionIndex]
    if (!option) return
    increment(event.shiftKey ? localDebuffs : localBuffs, option.id)
    return
  }

  if (event.key.toLowerCase() === 'c') {
    stopModalShortcut(event)
    clearAllLocalStatuses()
    return
  }

  if (event.key === 'Enter') {
    stopModalShortcut(event)
    saveLocalStatuses()
  }
}

watch(
  () => [props.card, props.statusDefinitions],
  () => syncRecords(),
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', handleModalKeydown, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleModalKeydown, true)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[1000] bg-black/70 p-4 backdrop-blur-sm" @click="emit('close')">
      <div
        class="mx-auto max-w-5xl rounded-[1.75rem] border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl"
        @click.stop
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Buffs & Debuffs</p>
            <h2 class="mt-2 text-2xl font-semibold">{{ card.title }}</h2>
            <p class="mt-1 text-sm text-white/60">
              This list comes from the room status CSV, or the fallback definitions if no CSV is set.
            </p>
          </div>
          <button
            type="button"
            class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
            @click="emit('close')"
          >
            Close
          </button>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <section class="rounded-[1.5rem] border border-emerald-400/15 bg-emerald-400/5 p-4">
            <h3 class="text-lg font-semibold text-emerald-200">Buffs</h3>
            <div class="mt-4 space-y-3">
              <div
                v-for="(option, optionIndex) in buffDefinitions"
                :key="option.id"
                class="grid gap-3 rounded-2xl bg-black/20 px-4 py-3"
              >
                <div class="flex items-center justify-between gap-4">
                  <div class="flex min-w-0 items-center gap-3">
                    <span
                      class="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/12 text-xs font-bold text-emerald-100"
                    >
                      {{ optionIndex === 9 ? 0 : optionIndex + 1 }}
                    </span>
                    <span class="group relative min-w-0 font-medium">
                      {{ option.name }}
                      <span
                        v-if="option.description"
                        class="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-xl border border-white/10 bg-neutral-950/95 p-3 text-xs leading-relaxed text-white/80 shadow-2xl group-hover:block"
                      >
                        {{ option.description }}
                      </span>
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-sm font-semibold transition hover:bg-white/5"
                      @click="decrement(localBuffs, option.id)"
                    >
                      -
                    </button>
                    <span class="min-w-10 text-center font-semibold">{{ localBuffs[option.id] ?? 0 }}</span>
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-sm font-semibold transition hover:bg-white/5"
                      @click="increment(localBuffs, option.id)"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/5"
                      @click="clearValue(localBuffs, option.id)"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-[1.5rem] border border-rose-400/15 bg-rose-400/5 p-4">
            <h3 class="text-lg font-semibold text-rose-200">Debuffs</h3>
            <div class="mt-4 space-y-3">
              <div
                v-for="(option, optionIndex) in debuffDefinitions"
                :key="option.id"
                class="grid gap-3 rounded-2xl bg-black/20 px-4 py-3"
              >
                <div class="flex items-center justify-between gap-4">
                  <div class="flex min-w-0 items-center gap-3">
                    <span
                      class="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-rose-300/25 bg-rose-300/12 text-xs font-bold text-rose-100"
                    >
                      {{ optionIndex === 9 ? 0 : optionIndex + 1 }}
                    </span>
                    <span class="group relative min-w-0 font-medium">
                      {{ option.name }}
                      <span
                        v-if="option.description"
                        class="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-xl border border-white/10 bg-neutral-950/95 p-3 text-xs leading-relaxed text-white/80 shadow-2xl group-hover:block"
                      >
                        {{ option.description }}
                      </span>
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-sm font-semibold transition hover:bg-white/5"
                      @click="decrement(localDebuffs, option.id)"
                    >
                      -
                    </button>
                    <span class="min-w-10 text-center font-semibold">{{ localDebuffs[option.id] ?? 0 }}</span>
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-sm font-semibold transition hover:bg-white/5"
                      @click="increment(localDebuffs, option.id)"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      class="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/5"
                      @click="clearValue(localDebuffs, option.id)"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
            @click="
              emit('save', {
                buffs: {},
                debuffs: {},
              })
            "
          >
            Clear All
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
            @click="saveLocalStatuses"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
