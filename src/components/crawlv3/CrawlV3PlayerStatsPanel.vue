<script setup lang="ts">
const lifePoints = defineModel<string>('lifePoints', { required: true })
const actionPoints = defineModel<string>('actionPoints', { required: true })

defineProps<{
  eyebrow: string
  playerName: string | undefined
  editable?: boolean
  wide?: boolean
}>()

defineEmits<{
  (event: 'save'): void
  (event: 'adjust-life', amount: number): void
  (event: 'adjust-action', amount: number): void
  (event: 'reset-action'): void
}>()

const statInputClasses = {
  editable:
    'min-w-[7rem] flex-1 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 transition outline-none focus:border-amber-300/50',
  readonly:
    'pointer-events-none min-w-[7rem] flex-1 cursor-default select-none rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-white/75 caret-transparent outline-none focus:border-white/10 focus:ring-0',
} as const

const neutralButtonClass =
  'cursor-pointer rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5'
</script>

<template>
  <div
    class="rounded-[1.4rem] border border-white/10 bg-neutral-950/70 p-4 shadow-2xl backdrop-blur-sm"
    :class="wide ? 'xl:col-span-2' : ''"
  >
    <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">{{ eyebrow }}</p>
    <h2 class="mt-2 text-2xl font-semibold">{{ playerName }}</h2>

    <div class="mt-4 space-y-3">
      <div class="space-y-2">
        <span class="mb-2 block text-sm text-white/60">Hit Points</span>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="lifePoints"
            type="number"
            :readonly="!editable"
            :tabindex="editable ? undefined : -1"
            :class="editable ? statInputClasses.editable : statInputClasses.readonly"
            @keyup.enter="editable && $emit('save')"
            @blur="editable && $emit('save')"
          />
          <template v-if="editable">
            <button type="button" :class="neutralButtonClass" @click="$emit('adjust-life', -5)">-5</button>
            <button type="button" :class="neutralButtonClass" @click="$emit('adjust-life', -1)">-1</button>
            <button type="button" :class="neutralButtonClass" @click="$emit('adjust-life', 1)">+1</button>
            <button type="button" :class="neutralButtonClass" @click="$emit('adjust-life', 5)">+5</button>
          </template>
        </div>
      </div>

      <div class="space-y-2">
        <span class="block text-sm text-white/60">Action Points</span>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="actionPoints"
            type="number"
            :readonly="!editable"
            :tabindex="editable ? undefined : -1"
            :class="editable ? statInputClasses.editable : statInputClasses.readonly"
            @keyup.enter="editable && $emit('save')"
            @blur="editable && $emit('save')"
          />
          <template v-if="editable">
            <button type="button" :class="neutralButtonClass" @click="$emit('adjust-action', -1)">-1</button>
            <button type="button" :class="neutralButtonClass" @click="$emit('adjust-action', 1)">+1</button>
            <button type="button" :class="neutralButtonClass" @click="$emit('reset-action')">Reset</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
