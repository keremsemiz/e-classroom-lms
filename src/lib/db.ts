import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  libsqlClient: Client | undefined
}

// Get env vars at CALL time, not module load time
function getEnvVars() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  return { databaseUrl, authToken }
}

// Create libsql client lazily
function getLibsqlClient() {
  if (globalForPrisma.libsqlClient) {
    return globalForPrisma.libsqlClient
  }

  const { databaseUrl, authToken } = getEnvVars()

  console.log('[DB] Creating libsql client...')
  console.log('[DB] DATABASE_URL:', databaseUrl ? `${databaseUrl.substring(0, 30)}...` : 'UNDEFINED')
  console.log('[DB] DATABASE_AUTH_TOKEN:', authToken ? `SET (${authToken.length} chars)` : 'UNDEFINED')

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Please check Vercel environment variables.')
  }

  if (!authToken) {
    throw new Error('DATABASE_AUTH_TOKEN is not set. Please check Vercel environment variables.')
  }

  const client = createClient({
    url: databaseUrl,
    authToken: authToken,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.libsqlClient = client
  }

  return client
}

// Create Prisma client lazily
function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  console.log('[DB] Creating Prisma client...')

  const libsql = getLibsqlClient()
  const adapter = new PrismaLibSQL(libsql)
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

// Export a getter function instead of the client directly
// This ensures env vars are read at request time, not module load time
export const db = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient()
    return client[prop as keyof PrismaClient]
  }
}) as PrismaClient
