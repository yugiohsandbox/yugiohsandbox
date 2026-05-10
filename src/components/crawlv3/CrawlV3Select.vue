<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: { value: string; label: string }[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const isOpen = ref(false)
const rootElement = ref<HTMLElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label ?? props.options[0]?.label ?? '',
)

function closeDropdown() {
  isOpen.value = false
}

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function selectOption(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
  closeDropdown()
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!rootElement.value?.contains(event.target as Node | null)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <div ref="rootElement" class="relative">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 rounded-full border border-white/10 bg-neutral-950 px-4 py-2.5 text-left text-sm text-white transition outline-none hover:border-white/25 hover:bg-white/[0.08] focus:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-55"
      :disabled="disabled"
      :aria-expanded="isOpen"
      @click="toggleDropdown"
      @keydown.escape.stop="closeDropdown"
    >
      <span class="min-w-0 truncate">{{ selectedLabel }}</span>
      <span
        class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-white/70 transition"
        :class="isOpen ? 'rotate-180' : ''"
      >
        <span class="h-2 w-2 rotate-45 border-r-2 border-b-2 border-current" />
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-[1rem] border border-white/12 bg-neutral-950/98 p-1.5 shadow-2xl ring-1 ring-white/5 backdrop-blur-sm"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[0.8rem] px-3 py-2 text-left text-sm transition"
        :class="
          option.value === modelValue
            ? 'bg-amber-300/18 text-amber-100'
            : 'text-white/80 hover:bg-white/8 hover:text-white'
        "
        @click="selectOption(option.value)"
      >
        <span class="min-w-0 truncate">{{ option.label }}</span>
        <span v-if="option.value === modelValue" class="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
      </button>
    </div>
  </div>
</template>
