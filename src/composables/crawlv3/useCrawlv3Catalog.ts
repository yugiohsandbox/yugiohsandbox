import { computed, ref, watch, type ComputedRef, type Ref, type ShallowRef } from 'vue'

import { useCrawlv3StatusDefinitions } from '@/composables/crawlv3/useCrawlv3StatusDefinitions'
import { createDefaultCrawlv3Config, loadCatalogCards } from '@/lib/crawlv3/catalog'
import { cloneGame } from '@/lib/crawlv3/game-state'
import { safeTrim, withDefaultCatalogConfig } from '@/lib/crawlv3/ui-utils'
import type { Crawlv3CatalogCard, Crawlv3CatalogConfig, Crawlv3Game } from '@/types/crawlv3'
import type { QueuedCrawlv3Action } from '@/types/crawlv3-ui'

type Crawlv3Phase = 'join' | 'lobby' | 'game'

type UseCrawlv3CatalogOptions = {
  game: ComputedRef<Crawlv3Game | null>
  serverSnapshot: ShallowRef<Crawlv3Game | null>
  phase: ComputedRef<Crawlv3Phase>
  enqueueAction: (action: QueuedCrawlv3Action) => void
}

export function useCrawlv3Catalog({ game, serverSnapshot, phase, enqueueAction }: UseCrawlv3CatalogOptions) {
  const configDraft = ref<Crawlv3CatalogConfig>(createDefaultCrawlv3Config())
  const catalogCards = ref<Crawlv3CatalogCard[]>([])
  const catalogLoading = ref(false)
  const catalogError = ref<string | null>(null)
  let catalogRequestId = 0

  const { statusDefinitions, statusLoading, statusError, resetStatusDefinitions, reloadStatuses } =
    useCrawlv3StatusDefinitions({
      config: computed(() => game.value?.config),
    })

  const canLoadSavedCatalog = computed(() => {
    const config = game.value?.config
    return !!safeTrim(config?.csvUrl) && !!safeTrim(config?.headers?.id) && !!safeTrim(config?.headers?.title)
  })

  function resetCatalogState() {
    catalogCards.value = []
    catalogError.value = null
    configDraft.value = createDefaultCrawlv3Config()
    resetStatusDefinitions()
  }

  function updateConfig() {
    enqueueAction({
      type: 'update_config',
      config: cloneGame(configDraft.value),
    })
  }

  async function reloadCatalog(config = game.value?.config) {
    if (!config || !safeTrim(config?.csvUrl) || !safeTrim(config?.headers?.id) || !safeTrim(config?.headers?.title)) {
      catalogCards.value = []
      catalogError.value = null
      return
    }

    const requestId = ++catalogRequestId
    catalogLoading.value = true
    catalogError.value = null

    try {
      const cards = await loadCatalogCards(config)
      if (requestId !== catalogRequestId) return
      catalogCards.value = cards
    } catch (err) {
      if (requestId !== catalogRequestId) return
      catalogCards.value = []
      catalogError.value =
        err instanceof Error ? err.message : 'Failed to load the CSV. Check the link and header names.'
    } finally {
      if (requestId === catalogRequestId) {
        catalogLoading.value = false
      }
    }
  }

  watch(
    () => serverSnapshot.value?.config,
    (config) => {
      if (!config) return
      configDraft.value = withDefaultCatalogConfig(cloneGame(config))
    },
    { immediate: true },
  )

  watch(
    () => JSON.stringify(game.value?.config ?? {}),
    () => {
      if (phase.value === 'lobby' && canLoadSavedCatalog.value) {
        void reloadCatalog()
      } else if (phase.value !== 'lobby') {
        catalogCards.value = []
        catalogError.value = null
      }
    },
    { immediate: true },
  )

  return {
    configDraft: configDraft as Ref<Crawlv3CatalogConfig>,
    catalogCards,
    catalogLoading,
    catalogError,
    statusDefinitions,
    statusLoading,
    statusError,
    canLoadSavedCatalog,
    resetStatusDefinitions,
    resetCatalogState,
    updateConfig,
    reloadCatalog,
    reloadStatuses,
  }
}
