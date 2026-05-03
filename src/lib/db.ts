import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  // Debug: Log if URL is missing
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set!')
  }

  // Check if using Turso (libsql:// URL)
  if (databaseUrl.startsWith('libsql://')) {
    if (!authToken) {
      throw new Error('DATABASE_AUTH_TOKEN is required for Turso!')
    }
    
    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }
  
  // Local SQLite development (file:./prisma/dev.db)
  return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
