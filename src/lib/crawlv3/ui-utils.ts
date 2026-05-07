import type { Crawlv3CatalogCard, Crawlv3CatalogConfig, Crawlv3CardState, Crawlv3Player } from '@/types/crawlv3'

import { createDefaultCrawlv3Config } from './catalog'

export function safeTrim(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function shuffleItems<T>(items: T[]) {
  const nextItems = [...items]
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = nextItems[index]
    nextItems[index] = nextItems[swapIndex]
    nextItems[swapIndex] = current
  }
  return nextItems
}

export function withDefaultCatalogConfig(config: Crawlv3CatalogConfig): Crawlv3CatalogConfig {
  const defaults = createDefaultCrawlv3Config()
  return {
    ...defaults,
    ...config,
    headers: {
      ...defaults.headers,
      ...config.headers,
    },
    statusHeaders: {
      ...defaults.statusHeaders,
      ...config.statusHeaders,
    },
  }
}

export function createCatalogPreviewCardState(
  card: Crawlv3CatalogCard,
  owner: Crawlv3Player = 'player1',
): Crawlv3CardState {
  return {
    instanceId: `catalog-preview-${card.id}`,
    cardId: card.id,
    owner,
    title: card.title,
    cost: card.cost,
    baseAtk: card.atk,
    baseDef: card.def,
    atk: card.atk,
    def: card.def,
    category: card.category,
    race: card.race,
    damageType: card.damageType,
    img: card.img,
    description: card.description,
    imageUrl: card.imageUrl,
    zone: 'deck',
    x: 0,
    y: 0,
    z: 0,
    order: 0,
    faceUp: true,
    rotated: false,
    buffs: {},
    debuffs: {},
  }
}
