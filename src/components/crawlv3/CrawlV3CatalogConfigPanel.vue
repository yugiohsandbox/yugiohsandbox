<script setup lang="ts">
import type { Crawlv3CatalogConfig, Crawlv3StatusDefinition } from '@/types/crawlv3'

const expanded = defineModel<boolean>('expanded', { required: true })
const config = defineModel<Crawlv3CatalogConfig>('config', { required: true })

defineProps<{
  isHost: boolean
  canPreviewCatalog: boolean
  catalogLoading: boolean
  catalogCount: number
  catalogError: string | null
  statusDefinitions: Crawlv3StatusDefinition[]
  statusLoading: boolean
  statusError: string | null
}>()

defineEmits<{
  (event: 'save-config'): void
  (event: 'preview-catalog'): void
  (event: 'preview-statuses'): void
}>()

const catalogHeaderFields: [keyof Crawlv3CatalogConfig['headers'], string][] = [
  ['id', 'ID header'],
  ['title', 'Title header'],
  ['cost', 'Cost header'],
  ['atk', 'ATK header'],
  ['def', 'DEF header'],
  ['category', 'Category header'],
  ['race', 'Race header'],
  ['damageType', 'Damage type header'],
  ['img', 'Image header'],
  ['description', 'Description header'],
]

const statusHeaderFields: [keyof Crawlv3CatalogConfig['statusHeaders'], string][] = [
  ['id', 'Status id header'],
  ['name', 'Status name header'],
  ['type', 'Status type header'],
  ['description', 'Status description header'],
]
</script>

<template>
  <section class="rounded-[1.75rem] border border-white/10 bg-neutral-950/70 p-6 shadow-2xl backdrop-blur-sm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Catalog Setup</p>
        <h2 class="mt-2 text-2xl font-semibold">CSV + Images</h2>
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Hide Config' : 'Show Config' }}
        </button>
        <button
          v-if="isHost && expanded"
          type="button"
          class="cursor-pointer rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
          @click="$emit('save-config')"
        >
          Save Config
        </button>
      </div>
    </div>

    <div v-if="!expanded" class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-white/60">
      Room config is collapsed by default. Expand it to edit the card CSV, image links, status CSV, and default point
      values.
    </div>

    <div v-else class="mt-5 space-y-4">
      <label class="block">
        <span class="mb-2 block text-sm text-white/65">Card CSV URL</span>
        <input
          v-model="config.csvUrl"
          :readonly="!isHost"
          type="url"
          placeholder="https://example.com/cards.csv"
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
        />
      </label>

      <div class="grid gap-3 sm:grid-cols-2">
        <label v-for="[key, label] in catalogHeaderFields" :key="key" class="block">
          <span class="mb-2 block text-sm text-white/65">{{ label }}</span>
          <input
            v-model="config.headers[key]"
            :readonly="!isHost"
            type="text"
            :placeholder="key"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
          />
        </label>
      </div>

      <label class="block">
        <span class="mb-2 block text-sm text-white/65">Image URL template</span>
        <input
          v-model="config.imageUrlTemplate"
          :readonly="!isHost"
          type="text"
          placeholder="https://cdn.example.com/cards/{id}.png"
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
        />
        <span class="mt-2 block text-xs text-white/45">
          Use <code>{id}</code> where the card id should be inserted.
        </span>
      </label>

      <label class="block">
        <span class="mb-2 block text-sm text-white/65">Per-id image overrides</span>
        <textarea
          v-model="config.imageOverridesText"
          :readonly="!isHost"
          rows="5"
          placeholder="123,https://cdn.example.com/cards/123.png"
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm text-white/65">Field image URL</span>
        <input
          v-model="config.fieldImageUrl"
          :readonly="!isHost"
          type="url"
          placeholder="https://cdn.example.com/field.png"
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
        />
      </label>

      <div class="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-white/88">Buff / Debuff CSV</p>
            <p class="mt-1 text-sm text-white/55">
              Optional CSV with <code>id</code>, <code>name</code>, <code>type</code>, and
              <code>description</code> columns.
            </p>
          </div>
          <p class="text-sm text-white/55">
            {{ statusLoading ? 'Loading status list...' : `${statusDefinitions.length} status entries ready` }}
          </p>
        </div>

        <div class="mt-4 space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm text-white/65">Status CSV URL</span>
            <input
              v-model="config.statusCsvUrl"
              :readonly="!isHost"
              type="url"
              placeholder="https://example.com/statuses.csv"
              class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
            />
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label v-for="[key, label] in statusHeaderFields" :key="key" class="block">
              <span class="mb-2 block text-sm text-white/65">{{ label }}</span>
              <input
                v-model="config.statusHeaders[key]"
                :readonly="!isHost"
                type="text"
                :placeholder="key"
                class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
              />
            </label>
          </div>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-2 block text-sm text-white/65">Default hit points</span>
          <input
            v-model.number="config.defaultLifePoints"
            :readonly="!isHost"
            type="number"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
          />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm text-white/65">Default action points</span>
          <input
            v-model.number="config.defaultActionPoints"
            :readonly="!isHost"
            type="number"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
          />
        </label>
      </div>

      <label class="block">
        <span class="mb-2 block text-sm text-white/65">Extra deck categories</span>
        <input
          v-model="config.extraDeckCategoriesText"
          :readonly="!isHost"
          type="text"
          placeholder="Fusion Unit, Ritual Unit"
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm text-white/65">Face-down table categories</span>
        <input
          v-model="config.faceDownCategoriesText"
          :readonly="!isHost"
          type="text"
          placeholder="Trap"
          class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition outline-none read-only:cursor-default read-only:opacity-80 focus:border-amber-300/50"
        />
      </label>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canPreviewCatalog || catalogLoading"
          @click="$emit('preview-catalog')"
        >
          {{ catalogLoading ? 'Loading...' : 'Preview Catalog' }}
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
          @click="$emit('preview-statuses')"
        >
          Preview Status List
        </button>
        <p v-if="catalogCount" class="self-center text-sm text-emerald-200">{{ catalogCount }} cards loaded</p>
      </div>

      <div class="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">Status Preview</p>
            <p class="mt-1 text-sm text-white/55">
              {{ statusLoading ? 'Loading status list...' : `${statusDefinitions.length} status names` }}
            </p>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="status in statusDefinitions"
            :key="`status-preview-${status.id}`"
            class="group relative rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/80"
          >
            {{ status.name || status.id }}
            <span
              v-if="status.description"
              class="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-xl border border-white/10 bg-neutral-950/95 p-3 text-left text-xs leading-relaxed font-medium text-white/80 shadow-2xl group-hover:block"
            >
              {{ status.description }}
            </span>
          </span>
        </div>

        <p v-if="statusError" class="mt-3 text-sm text-rose-300">{{ statusError }}</p>
      </div>

      <p v-if="catalogError" class="text-sm text-rose-300">{{ catalogError }}</p>
    </div>
  </section>
</template>
