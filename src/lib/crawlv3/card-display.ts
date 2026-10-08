import type { Crawlv3CardState, Crawlv3CatalogCard, Crawlv3Zone } from '@/types/crawlv3'

export type Crawlv3CardStat = 'atk' | 'def'

export function getCardStatColor(card: Crawlv3CardState, stat: Crawlv3CardStat, value = card[stat]) {
  const base = card[stat === 'atk' ? 'baseAtk' : 'baseDef']
  if (!hasDisplayValue(value) || !hasDisplayValue(base)) return 'text-white'
  const currentNumber = Number(value)
  const baseNumber = Number(base)
  if (!Number.isFinite(currentNumber) || !Number.isFinite(baseNumber)) return 'text-white'
  if (currentNumber > baseNumber) return 'text-green-400'
  if (currentNumber < baseNumber) return 'text-red-400'
  return 'text-white'
}

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
      return 'Draw'
    case 'extraDeck':
      return 'Extra Deck'
    case 'discard':
      return 'Spent'
    case 'exhausted':
      return 'Exhausted'
  }
}

export function formatFaceLabel(faceUp: boolean) {
  return faceUp ? 'Face Up' : 'Face Down'
}

export function formatPositionLabel(rotated: boolean) {
  return rotated ? 'Defense Position' : 'Attack Position'
}
