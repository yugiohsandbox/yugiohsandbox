import { collection, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore'

import { db } from '../lib/firebase.js'
import { verifyAuth } from '../lib/auth.js'
import {
  addCrawlv3Player2,
  addCrawlv3Spectator,
  CRAWLV3_GAMES_COLLECTION,
  getCrawlv3PlayerKey,
  isCrawlv3Spectator,
  sanitizeCrawlv3Config,
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

const handler = async (event: { body: string; headers: Record<string, string> }) => {
  try {
    const authResult = await verifyAuth(event)
    if (authResult.error) return authResult.error

    const body = JSON.parse(event.body) as { code: number; username: string }
    const code = Number(body.code)

    if (!Number.isInteger(code)) {
      return jsonResponse(400, { message: 'A valid room code is required' })
    }

    const querySnapshot = await getDocs(query(collection(db, CRAWLV3_GAMES_COLLECTION), where('code', '==', code)))
    if (querySnapshot.empty) {
      return jsonResponse(404, { message: 'Game not found' })
    }

    const gameDoc = querySnapshot.docs[0]
    const game = gameDoc.data() as Crawlv3Game
    game.config = sanitizeCrawlv3Config(game.config)
    game.spectators = Array.isArray(game.spectators) ? game.spectators : []

    if (getCrawlv3PlayerKey(game, authResult.auth.uid) || isCrawlv3Spectator(game, authResult.auth.uid)) {
      return jsonResponse(200, { id: gameDoc.id, ...game })
    }

    const docRef = doc(db, CRAWLV3_GAMES_COLLECTION, gameDoc.id)

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef)
      const current = snapshot.data() as Crawlv3Game | undefined

      if (!current) throw new Error('Game not found')
      current.spectators = Array.isArray(current.spectators) ? current.spectators : []
      if (getCrawlv3PlayerKey(current, authResult.auth.uid) || isCrawlv3Spectator(current, authResult.auth.uid)) return

      if (current.status === 'lobby' && !current.players.player2) {
        addCrawlv3Player2(current, authResult.auth.uid, body.username)
        transaction.update(docRef, {
          'players.player2': current.players.player2,
          _version: current._version,
        })
        return
      }

      addCrawlv3Spectator(current, authResult.auth.uid, body.username)
      transaction.update(docRef, {
        spectators: current.spectators,
        _version: current._version,
      })
    })

    const updatedSnapshot = await getDoc(docRef)
    const updatedGame = updatedSnapshot.data()

    return jsonResponse(200, { id: gameDoc.id, ...updatedGame })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : String(err)
    const statusCode = message === 'Game not found' ? 404 : 500

    return jsonResponse(statusCode, { message })
  }
}

export { handler }
