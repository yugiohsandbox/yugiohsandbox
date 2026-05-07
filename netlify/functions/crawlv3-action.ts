import { doc, runTransaction } from 'firebase/firestore'

import { db } from '../lib/firebase.js'
import { verifyAuth } from '../lib/auth.js'
import {
  applyAuthenticatedCrawlv3Action,
  CRAWLV3_GAMES_COLLECTION,
  type Crawlv3Action,
  type Crawlv3ActionResult,
  type Crawlv3Game,
} from '../lib/crawlv3.js'

const jsonHeaders = { 'Content-Type': 'application/json' }

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  }
}

function isActionShapeValid(action: Crawlv3Action | undefined): action is Crawlv3Action {
  return !!action?.type && typeof action.actionId === 'string' && action.actionId.trim().length > 0
}

const handler = async (event: { body: string; headers: Record<string, string> }) => {
  try {
    const authResult = await verifyAuth(event)
    if (authResult.error) return authResult.error

    const body = JSON.parse(event.body) as { gameId: string; action?: Crawlv3Action }
    if (!body.gameId || !isActionShapeValid(body.action)) {
      return jsonResponse(400, { message: 'gameId and a valid action are required' })
    }

    const action = body.action
    const docRef = doc(db, CRAWLV3_GAMES_COLLECTION, body.gameId)
    let result: Crawlv3ActionResult = { success: false, error: 'Unknown error' }
    let committedVersion: number | null = null

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef)
      if (!snapshot.exists()) {
        result = { success: false, error: 'Game not found' }
        return
      }

      const game = snapshot.data() as Crawlv3Game
      game.processedActions = Array.isArray(game.processedActions) ? game.processedActions : []
      const previousVersion = game._version ?? 0

      if (game.processedActions.includes(action.actionId)) {
        result = { success: true }
        committedVersion = previousVersion
        return
      }

      result = applyAuthenticatedCrawlv3Action(game, action, authResult.auth.uid)
      if (!result.success) return

      committedVersion = game._version
      transaction.set(docRef, game)
    })

    if (!result.success) {
      return jsonResponse(400, { message: result.error })
    }

    return jsonResponse(200, { success: true, version: committedVersion })
  } catch (err) {
    console.error(err)
    return jsonResponse(500, { message: err instanceof Error ? err.message : String(err) })
  }
}

export { handler }
