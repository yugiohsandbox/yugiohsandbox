import { ref, watch, type ComputedRef } from 'vue'

import { loadStatusDefinitions } from '@/lib/crawlv3/catalog'
import { cloneGame } from '@/lib/crawlv3/game-state'
import { CRAWLV3_FALLBACK_STATUSES } from '@/lib/crawlv3/status-options'
import { safeTrim } from '@/lib/crawlv3/ui-utils'
import type { Crawlv3CatalogConfig } from '@/types/crawlv3'

type UseCrawlv3StatusDefinitionsOptions = {
  config?: ComputedRef<Crawlv3CatalogConfig | undefined>
}

export function useCrawlv3StatusDefinitions({ config }: UseCrawlv3StatusDefinitionsOptions = {}) {
  const statusDefinitions = ref(cloneGame(CRAWLV3_FALLBACK_STATUSES))
  const statusLoading = ref(false)
  const statusError = ref<string | null>(null)
  let statusRequestId = 0

  function resetStatusDefinitions() {
    statusDefinitions.value = cloneGame(CRAWLV3_FALLBACK_STATUSES)
    statusLoading.value = false
    statusError.value = null
  }

  async function reloadStatuses(configOverride = config?.value) {
    const requestId = ++statusRequestId
    const hasConfiguredCsv =
      !!safeTrim(configOverride?.statusCsvUrl) &&
      !!safeTrim(configOverride?.statusHeaders?.id) &&
      !!safeTrim(configOverride?.statusHeaders?.name) &&
      !!safeTrim(configOverride?.statusHeaders?.type)

    if (!configOverride || !hasConfiguredCsv) {
      resetStatusDefinitions()
      return
    }

    statusLoading.value = true
    statusError.value = null

    try {
      const statuses = await loadStatusDefinitions(configOverride)
      if (requestId !== statusRequestId) return
      statusDefinitions.value = statuses.length ? statuses : cloneGame(CRAWLV3_FALLBACK_STATUSES)
    } catch (err) {
      if (requestId !== statusRequestId) return
      statusDefinitions.value = cloneGame(CRAWLV3_FALLBACK_STATUSES)
      statusError.value =
        err instanceof Error
          ? err.message
          : 'Failed to load the status CSV. Using fallback buff and debuff definitions.'
    } finally {
      if (requestId === statusRequestId) {
        statusLoading.value = false
      }
    }
  }

  if (config) {
    watch(
      () => JSON.stringify(config.value ?? {}),
      () => {
        void reloadStatuses()
      },
      { immediate: true },
    )
  }

  return {
    statusDefinitions,
    statusLoading,
    statusError,
    resetStatusDefinitions,
    reloadStatuses,
  }
}
