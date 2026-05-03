import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  // Debug: Check if environment variables are set
  console.log('[DB Debug] DATABASE_URL set:', !!databaseUrl)
  console.log('[DB Debug] DATABASE_AUTH_TOKEN set:', !!authToken)

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set! ' +
      'Please add DATABASE_URL to your Vercel project environment variables. ' +
      'For Turso, use format: libsql://your-database.turso.io'
    )
  }

  // Turso/libsql connection
  if (!authToken) {
    throw new Error(
      'DATABASE_AUTH_TOKEN environment variable is not set! ' +
      'Please add DATABASE_AUTH_TOKEN to your Vercel project environment variables. ' +
      'You can find this in your Turso dashboard.'
    )
  }

  const libsql = createClient({
    url: databaseUrl,
    authToken: authToken,
  })
  
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}

// Create a singleton instance to prevent multiple connections in development
function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  try {
    const client = createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client
    }
    return client
  } catch (error) {
    console.error('[DB Error] Failed to create Prisma client:', error)
    throw error
  }
}

export const db = getPrismaClient()
