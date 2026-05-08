import type { Crawlv3CardState, Crawlv3CatalogCard, Crawlv3Zone } from '@/types/crawlv3'

export type Crawlv3CardStat = 'atk' | 'def'

export function hasDisplayValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim().length > 0
}

export function formatDisplayValue(value: unknown) {
  return hasDisplayValue(value) ? String(value) : ''
}

export function getCardTags(card: Pick<Crawlv3CardState | Crawlv3CatalogCard, 'race' | 'damageType'>) {
  return [card.race, card.damageType].filter(hasDisplayValue).map(String).join(' | ')
}

export function shouldShowCardStat(card: Crawlv3CardState, stat: Crawlv3CardStat) {
  const baseKey = stat === 'atk' ? 'baseAtk' : 'baseDef'
  return hasDisplayValue(card[stat]) || hasDisplayValue(card[baseKey])
}

export function formatZoneLabel(zone: Crawlv3Zone) {
  switch (zone) {
    case 'table':
      return 'Table'
    case 'hand':
      return 'Hand'
    case 'deck':
      return 'Deck'
    case 'extraDeck':
      return 'Extra Deck'
    case 'discard':
      return 'Discard'
  }
}

export function formatFaceLabel(faceUp: boolean) {
  return faceUp ? 'Face Up' : 'Face Down'
}

export function formatPositionLabel(rotated: boolean) {
  return rotated ? 'Defense Position' : 'Attack Position'
}
