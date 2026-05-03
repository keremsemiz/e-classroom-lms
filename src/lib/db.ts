import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// DO NOT cache anything - create fresh on every call
let callCount = 0

function createPrismaClient(): PrismaClient {
  callCount++
  const callId = callCount

  console.log(`\n========== [DB CALL #${callId}] ==========`)
  console.log('Time:', new Date().toISOString())

  // Check process.env directly
  const envKeys = Object.keys(process.env)
  const dbKeys = envKeys.filter(k => k.includes('DATABASE'))

  console.log('All DATABASE keys in process.env:', dbKeys)
  console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL)
  console.log('process.env.DATABASE_AUTH_TOKEN:', process.env.DATABASE_AUTH_TOKEN ? `SET (${process.env.DATABASE_AUTH_TOKEN.length} chars)` : 'NOT SET')

  // Read env vars
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!databaseUrl) {
    console.error(`[DB CALL #${callId}] ERROR: DATABASE_URL is undefined!`)
    console.error('Available env keys:', envKeys.slice(0, 20).join(', '))
    throw new Error(`DATABASE_URL is undefined. Keys with DATABASE: ${dbKeys.join(', ') || 'NONE'}`)
  }

  if (!authToken) {
    console.error(`[DB CALL #${callId}] ERROR: DATABASE_AUTH_TOKEN is undefined!`)
    throw new Error('DATABASE_AUTH_TOKEN is undefined')
  }

  console.log(`[DB CALL #${callId}] Creating libsql client with URL:`, databaseUrl.substring(0, 50) + '...')

  try {
    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken,
    })

    console.log(`[DB CALL #${callId}] libsql client created successfully`)

    const adapter = new PrismaLibSQL(libsql)
    console.log(`[DB CALL #${callId}] PrismaLibSQL adapter created`)

    const client = new PrismaClient({ adapter })
    console.log(`[DB CALL #${callId}] PrismaClient created successfully`)

    return client
  } catch (error) {
    console.error(`[DB CALL #${callId}] Error creating client:`, error)
    throw error
  }
}

// Export a function that creates fresh client every time
export function getDb(): PrismaClient {
  return createPrismaClient()
}

// Export db that calls getDb on every property access
export const db = new Proxy({} as PrismaClient, {
  get(target, prop: string) {
    console.log(`[Proxy] Accessing property: ${prop}`)
    const client = getDb()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
