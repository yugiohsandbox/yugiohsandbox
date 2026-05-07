import { addDoc, collection } from 'firebase/firestore'

import { db } from '../lib/firebase.js'
import { verifyAuth } from '../lib/auth.js'
import {
  CRAWLV3_GAMES_COLLECTION,
  createCrawlv3Game,
  sanitizeCrawlv3Config,
  type Crawlv3CatalogConfig,
} from '../lib/crawlv3.js'

const jsonHeaders = { 'Content-Type': 'application/json' }

const handler = async (event: { body: string; headers: Record<string, string> }) => {
  try {
    const authResult = await verifyAuth(event)
    if (authResult.error) return authResult.error

    const body = JSON.parse(event.body) as { username: string; config?: Crawlv3CatalogConfig }
    const config = sanitizeCrawlv3Config(body.config)
    const game = createCrawlv3Game(authResult.auth.uid, body.username, config)
    const docRef = await addDoc(collection(db, CRAWLV3_GAMES_COLLECTION), game)

    return {
      statusCode: 200,
      body: JSON.stringify({ id: docRef.id, code: game.code }),
      headers: jsonHeaders,
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ message: err instanceof Error ? err.message : String(err) }),
    }
  }
}

export { handler }
