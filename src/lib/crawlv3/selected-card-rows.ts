import { getCardTags } from '@/lib/crawlv3/card-display'
import type { Crawlv3CatalogCard } from '@/types/crawlv3'

export type Crawlv3SelectedCardRow = {
  card: Crawlv3CatalogCard
  count: number
}

export function getSelectedCardRows(cards: Crawlv3CatalogCard[] | undefined): Crawlv3SelectedCardRow[] {
  const rows = new Map<string, Crawlv3SelectedCardRow>()

  for (const card of cards ?? []) {
    const existing = rows.get(card.id)
    if (existing) {
      existing.count += 1
    } else {
      rows.set(card.id, { card, count: 1 })
    }
  }

  return [...rows.values()].sort((left, right) => left.card.title.localeCompare(right.card.title))
}

export function getSelectedCardSubtext(card: Crawlv3CatalogCard) {
  return [`Cost ${card.cost || '-'}`, getCardTags(card)].filter(Boolean).join(' | ')
}
