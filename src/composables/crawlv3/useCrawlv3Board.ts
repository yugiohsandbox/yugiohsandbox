import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'

import { clampRatio, getTopDeckCard, getTopPileCard } from '@/lib/crawlv3/game-state'
import { shuffleItems } from '@/lib/crawlv3/ui-utils'
import type { Crawlv3CardState, Crawlv3Game, Crawlv3Player, Crawlv3Zone } from '@/types/crawlv3'
import type { Crawlv3DragState, Crawlv3PileZone, Crawlv3TooltipState, QueuedCrawlv3Action } from '@/types/crawlv3-ui'

type UseCrawlv3BoardOptions = {
  game: ComputedRef<Crawlv3Game | null>
  myPlayer: ComputedRef<Crawlv3Player | null>
  isPerspectiveFlipped: ComputedRef<boolean>
  tableCards: ComputedRef<Crawlv3CardState[]>
  myHandCards: ComputedRef<Crawlv3CardState[]>
  myDeckCards: ComputedRef<Crawlv3CardState[]>
  myDiscardCards: ComputedRef<Crawlv3CardState[]>
  selectedCardId: Ref<string | null>
  enqueueAction: (action: QueuedCrawlv3Action) => void
  onClearTransientUi?: () => void
}

type TopMovablePileZone = Extract<Crawlv3PileZone, 'deck' | 'discard'>

const boardCardScaleStorageKey = 'crawlv3:board-card-scale'

function loadStoredBoardCardScale() {
  if (typeof window === 'undefined') return 1
  const storedValue = Number(window.localStorage.getItem(boardCardScaleStorageKey))
  return Number.isFinite(storedValue) ? Math.min(1.5, Math.max(0.65, storedValue)) : 1
}

function parseCategoryList(categoriesText: string | undefined) {
  return (categoriesText ?? '')
    .split(',')
    .map((category) => category.trim().toLowerCase())
    .filter(Boolean)
}

function cardMatchesCategories(card: Pick<Crawlv3CardState, 'category'>, categories: string[]) {
  if (!categories.length) return false
  const cardCategories = card.category
    .split(',')
    .map((category) => category.trim().toLowerCase())
    .filter(Boolean)

  return cardCategories.some((category) => categories.includes(category))
}

export function useCrawlv3Board({
  game,
  myPlayer,
  isPerspectiveFlipped,
  tableCards,
  myHandCards,
  myDeckCards,
  myDiscardCards,
  selectedCardId,
  enqueueAction,
  onClearTransientUi,
}: UseCrawlv3BoardOptions) {
  const boardCardScale = ref(loadStoredBoardCardScale())
  const hoveredTooltip = ref<Crawlv3TooltipState | null>(null)
  const dragState = ref<Crawlv3DragState | null>(null)

  const boardCardScaleLabel = computed(() => `${Math.round(boardCardScale.value * 100)}%`)

  const dragGhostStyle = computed(() => {
    const currentDrag = dragState.value

    if (!currentDrag) {
      return {
        left: '0px',
        top: '0px',
      }
    }

    return {
      left: `${currentDrag.ghostX}px`,
      top: `${currentDrag.ghostY}px`,
      width: `${currentDrag.cardWidth}px`,
      height: `${currentDrag.cardHeight}px`,
    }
  })

  function clearBoardTransientUi() {
    hoveredTooltip.value = null
    dragState.value = null
  }

  function getCardRenderFace(card: Crawlv3CardState) {
    if (!myPlayer.value) return card.zone !== 'hand' && card.faceUp
    if (card.zone === 'hand') return card.owner === myPlayer.value
    return card.faceUp
  }

  function canSeeCardDetails(card: Crawlv3CardState) {
    if (!myPlayer.value) return card.faceUp && card.zone !== 'hand'
    if (card.owner === myPlayer.value) return true
    if (card.zone === 'hand') return false
    return card.faceUp
  }

  function normalizeZonePoint(zone: Crawlv3Zone, x: number, y: number) {
    if (!isPerspectiveFlipped.value || (zone !== 'table' && zone !== 'hand')) {
      return { x, y }
    }

    return {
      x: clampRatio(1 - x),
      y: clampRatio(1 - y),
    }
  }

  function cardPositionStyle(card: Crawlv3CardState) {
    const scale = boardCardScale.value.toFixed(2)
    const point = normalizeZonePoint(card.zone, card.x, card.y)
    const width =
      card.zone === 'table'
        ? `calc(clamp(1.75rem, 5.15%, 8.4rem) * ${scale})`
        : card.zone === 'hand'
          ? `calc(clamp(1.6rem, 4.75%, 7.2rem) * ${scale})`
          : undefined

    return {
      left: `${(point.x * 100).toFixed(2)}%`,
      top: `${(point.y * 100).toFixed(2)}%`,
      zIndex: String(card.z),
      transform: 'translate(-50%, -50%)',
      ...(width ? { width } : {}),
    }
  }

  function selectCard(cardId: string) {
    selectedCardId.value = selectedCardId.value === cardId ? null : cardId
  }

  function adjustBoardCardScale(delta: number) {
    boardCardScale.value = Math.min(1.5, Math.max(0.65, Number((boardCardScale.value + delta).toFixed(2))))
  }

  function getTablePlacementPatch(card: Crawlv3CardState) {
    const faceDown = cardMatchesCategories(card, parseCategoryList(game.value?.config.faceDownCategoriesText))
    return {
      faceUp: !faceDown,
      rotated: faceDown,
    }
  }

  function startCardDrag(card: Crawlv3CardState, event: PointerEvent) {
    if (!myPlayer.value || card.owner !== myPlayer.value || event.button !== 0) return

    const cardElement = event.currentTarget as HTMLElement | null
    const cardShell = (event.target as HTMLElement | null)?.closest('[data-crawlv3-card-shell]') as HTMLElement | null
    const positionElement = cardShell ?? cardElement
    const rect = positionElement?.getBoundingClientRect()
    const pointerOffsetX = rect ? event.clientX - rect.left : (positionElement?.offsetWidth ?? 0) / 2
    const pointerOffsetY = rect ? event.clientY - rect.top : (positionElement?.offsetHeight ?? 0) / 2

    event.preventDefault()
    hoveredTooltip.value = null
    dragState.value = {
      instanceId: card.instanceId,
      startX: event.clientX,
      startY: event.clientY,
      ghostX: rect?.left ?? event.clientX - pointerOffsetX,
      ghostY: rect?.top ?? event.clientY - pointerOffsetY,
      pointerOffsetX,
      pointerOffsetY,
      cardWidth: rect?.width || positionElement?.offsetWidth || 0,
      cardHeight: rect?.height || positionElement?.offsetHeight || 0,
      active: false,
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function resolveDropTarget(clientX: number, clientY: number, currentDrag?: Crawlv3DragState) {
    const elements = document.elementsFromPoint(clientX, clientY)

    for (const element of elements) {
      const dropElement = (element as HTMLElement).closest('[data-crawlv3-drop-zone]') as HTMLElement | null
      if (!dropElement) continue

      const zone = dropElement.dataset.crawlv3DropZone as Crawlv3Zone
      const owner = dropElement.dataset.crawlv3Owner as Crawlv3Player | undefined
      const rect = dropElement.getBoundingClientRect()

      if (zone === 'deck' || zone === 'extraDeck' || zone === 'discard') {
        return { zone, owner }
      }

      const centerX = currentDrag ? clientX - currentDrag.pointerOffsetX + currentDrag.cardWidth / 2 : clientX
      const centerY = currentDrag ? clientY - currentDrag.pointerOffsetY + currentDrag.cardHeight / 2 : clientY
      const rawX = clampRatio((centerX - rect.left) / rect.width)
      const rawY = clampRatio((centerY - rect.top) / rect.height)
      const point = normalizeZonePoint(zone, rawX, rawY)

      return {
        zone,
        owner,
        x: point.x,
        y: point.y,
      }
    }

    return null
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragState.value) return

    const deltaX = event.clientX - dragState.value.startX
    const deltaY = event.clientY - dragState.value.startY
    const nextActive = dragState.value.active || Math.sqrt(deltaX * deltaX + deltaY * deltaY) > 6

    if (nextActive && !dragState.value.active) {
      selectedCardId.value = dragState.value.instanceId
    }

    dragState.value = {
      ...dragState.value,
      ghostX: event.clientX - dragState.value.pointerOffsetX,
      ghostY: event.clientY - dragState.value.pointerOffsetY,
      active: nextActive,
    }
  }

  function handlePointerUp(event: PointerEvent) {
    const currentDrag = dragState.value
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    clearBoardTransientUi()
    onClearTransientUi?.()

    if (!currentDrag) return

    const card = game.value?.cards[currentDrag.instanceId]
    if (!card) return

    if (!currentDrag.active) {
      selectCard(card.instanceId)
      return
    }

    const target = resolveDropTarget(event.clientX, event.clientY, currentDrag)
    if (!target || !myPlayer.value) return

    if (
      (target.zone === 'deck' || target.zone === 'extraDeck' || target.zone === 'discard' || target.zone === 'hand') &&
      target.owner !== myPlayer.value
    ) {
      return
    }

    const entersTableFromAnotherZone = target.zone === 'table' && card.zone !== 'table'
    const tablePlacementPatch = entersTableFromAnotherZone ? getTablePlacementPatch(card) : {}

    enqueueAction({
      type: 'move_card',
      instanceId: card.instanceId,
      zone: target.zone,
      ...(target.zone === 'deck' || target.zone === 'extraDeck' || target.zone === 'discard'
        ? {}
        : { x: target.x, y: target.y }),
      ...tablePlacementPatch,
    })
  }

  function defaultZonePosition(zone: Exclude<Crawlv3Zone, 'deck' | 'extraDeck' | 'discard'>) {
    const zoneCards = zone === 'table' ? tableCards.value.length : myHandCards.value.length
    if (zone === 'hand') {
      const slotIndex = zoneCards % 6
      const rowOffset = Math.floor(zoneCards / 6) * 0.015
      const randomOffset = (Math.random() - 0.5) * 0.035
      const centeredSlots = [0.5, 0.43, 0.57, 0.36, 0.64, 0.71]
      return {
        x: clampRatio(centeredSlots[slotIndex] + rowOffset + randomOffset, 0.5),
        y: 0.5,
      }
    }

    return {
      x: clampRatio(0.18 + (zoneCards % 6) * 0.13, 0.5),
      y: clampRatio(0.2 + Math.floor(zoneCards / 6) * 0.17, 0.5),
    }
  }

  function moveCardToZone(instanceId: string, zone: Crawlv3Zone) {
    if (zone === 'deck' || zone === 'extraDeck' || zone === 'discard') {
      enqueueAction({
        type: 'move_card',
        instanceId,
        zone,
      })
      return
    }

    const position = defaultZonePosition(zone)
    const card = game.value?.cards[instanceId]
    const tablePlacementPatch = zone === 'table' && card?.zone !== 'table' && card ? getTablePlacementPatch(card) : {}

    enqueueAction({
      type: 'move_card',
      instanceId,
      zone,
      x: position.x,
      y: position.y,
      ...tablePlacementPatch,
    })
  }

  function moveTopPileCardTo(sourceZone: TopMovablePileZone, targetZone: Crawlv3Zone) {
    if (!myPlayer.value || !game.value) return
    const topCard =
      sourceZone === 'deck'
        ? getTopDeckCard(game.value.cards, myPlayer.value)
        : getTopPileCard(game.value.cards, 'discard', myPlayer.value)

    if (!topCard) return
    moveCardToZone(topCard.instanceId, targetZone)
  }

  function shuffleDeck() {
    const shuffledIds = shuffleItems(myDeckCards.value).map((card) => card.instanceId)

    enqueueAction({
      type: 'shuffle_deck',
      orderedCardIds: shuffledIds,
    })
  }

  function shuffleDiscardIntoDeck() {
    if (!myDiscardCards.value.length) return

    const shuffledIds = shuffleItems([...myDeckCards.value, ...myDiscardCards.value]).map((card) => card.instanceId)

    enqueueAction({
      type: 'shuffle_discard_into_deck',
      orderedCardIds: shuffledIds,
    })
  }

  function updateTooltip(card: Crawlv3CardState, event: MouseEvent) {
    if (!canSeeCardDetails(card)) return
    hoveredTooltip.value = {
      cardId: card.instanceId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  function clearTooltip(card?: Crawlv3CardState) {
    if (!card || hoveredTooltip.value?.cardId === card.instanceId) {
      hoveredTooltip.value = null
    }
  }

  watch(boardCardScale, (scale) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(boardCardScaleStorageKey, String(scale))
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  })

  return {
    boardCardScale,
    boardCardScaleLabel,
    hoveredTooltip,
    dragState,
    dragGhostStyle,
    clearBoardTransientUi,
    getCardRenderFace,
    canSeeCardDetails,
    cardPositionStyle,
    adjustBoardCardScale,
    startCardDrag,
    moveCardToZone,
    moveTopPileCardTo,
    shuffleDeck,
    shuffleDiscardIntoDeck,
    updateTooltip,
    clearTooltip,
  }
}
