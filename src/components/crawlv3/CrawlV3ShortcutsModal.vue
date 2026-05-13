<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
}>()

const shortcutGroups = [
  {
    title: 'Card Actions',
    shortcuts: [
      { keys: 'F', label: 'Flip selected card' },
      { keys: 'S', label: 'Switch selected card stance' },
      { keys: 'M', label: 'Open modifiers for selected card' },
      { keys: 'D', label: 'Move selected card to spent' },
      { keys: 'E', label: 'Move selected card to exhausted' },
      { keys: 'H', label: 'Move selected card to hand' },
      { keys: 'T', label: 'Move selected card to table' },
      { keys: 'Shift + drag to table', label: 'Place dragged card face-down in defense' },
    ],
  },
  {
    title: 'Draw & Resources',
    shortcuts: [
      { keys: 'Space', label: 'Draw a card' },
      { keys: 'A', label: 'Decrease action points by 1' },
      { keys: 'Shift + A', label: 'Increase action points by 1' },
      { keys: 'R', label: 'Reset action points' },
      { keys: '0-9', label: 'Subtract amount from hit points' },
      { keys: 'Shift + 0-9', label: 'Add amount to hit points' },
    ],
  },
  {
    title: 'Modifiers Modal',
    shortcuts: [
      { keys: '0-9', label: 'Increment corresponding buff' },
      { keys: 'Shift + 0-9', label: 'Increment corresponding debuff' },
      { keys: 'C', label: 'Clear all local modifier values' },
      { keys: 'Enter', label: 'Save modifier changes' },
    ],
  },
  {
    title: 'Overlays',
    shortcuts: [{ keys: 'Escape', label: 'Close open modal' }],
  },
]
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[1000] flex items-center bg-black/75 p-4 backdrop-blur-sm" @click="emit('close')">
      <div
        class="mx-auto max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl"
        @click.stop
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Reference</p>
            <h2 class="mt-2 text-2xl font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
            @click="emit('close')"
          >
            Close
          </button>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <section
            v-for="group in shortcutGroups"
            :key="group.title"
            class="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
          >
            <h3 class="text-sm font-semibold tracking-[0.24em] text-amber-100/80 uppercase">{{ group.title }}</h3>
            <div class="mt-4 space-y-2">
              <div
                v-for="shortcut in group.shortcuts"
                :key="`${group.title}-${shortcut.keys}`"
                class="flex items-center justify-between gap-4 rounded-[0.9rem] bg-black/18 px-3 py-2"
              >
                <span class="text-sm text-white/72">{{ shortcut.label }}</span>
                <kbd
                  class="shrink-0 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-xs font-semibold text-white/90"
                >
                  {{ shortcut.keys }}
                </kbd>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>
