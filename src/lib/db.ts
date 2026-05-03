import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'

// Cache for the Prisma client
let prismaClient: PrismaClient | null = null
let libsqlClient: Client | null = null

/**
 * Creates a new Prisma client with the libsql adapter.
 * Reads environment variables at call time to ensure they're available.
 */
export function createPrismaClient(): PrismaClient {
  // Read env vars at function call time
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  console.log('[createPrismaClient] Checking environment variables...')
  console.log('  DATABASE_URL:', databaseUrl ? `SET (${databaseUrl.length} chars, starts with: ${databaseUrl.substring(0, 30)}...)` : 'NOT SET')
  console.log('  DATABASE_AUTH_TOKEN:', authToken ? `SET (${authToken.length} chars)` : 'NOT SET')

  if (!databaseUrl) {
    const availableKeys = Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ') || 'NONE'
    throw new Error(
      `DATABASE_URL is not set. Available DATABASE keys: ${availableKeys}`
    )
  }

  if (!authToken) {
    throw new Error('DATABASE_AUTH_TOKEN is not set.')
  }

  // Create libsql client
  const libsql = createClient({
    url: databaseUrl,
    authToken: authToken,
  })

  // Create Prisma with libsql adapter
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}

/**
 * Gets the Prisma client, creating it if necessary.
 * In development, caches the client for reuse.
 * In production, creates fresh client each time to ensure env vars are read.
 */
export function getDb(): PrismaClient {
  // In development, cache the client
  if (process.env.NODE_ENV !== 'production' && prismaClient) {
    return prismaClient
  }

  const client = createPrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    prismaClient = client
  }

  return client
}

/**
 * For backward compatibility, export db as a PrismaClient-like object.
 * All property accesses are proxied to getDb() which reads env vars at call time.
 */
export const db = new Proxy({} as PrismaClient, {
  get(target, prop: string) {
    const client = getDb()
    const value = (client as any)[prop]
    // Bind methods to the client to preserve `this` context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
