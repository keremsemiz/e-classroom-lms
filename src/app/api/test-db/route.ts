import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

// Test database connection directly without Prisma
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  console.log('=== TEST-DB ENDPOINT ===')
  console.log('DATABASE_URL:', databaseUrl)
  console.log('DATABASE_AUTH_TOKEN length:', authToken?.length)

  if (!databaseUrl || !authToken) {
    return NextResponse.json({
      success: false,
      error: 'Environment variables not set',
      hasUrl: !!databaseUrl,
      hasToken: !!authToken
    }, { status: 500 })
  }

  try {
    // Test direct libsql connection
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    })

    // Try a simple query
    const result = await client.execute('SELECT 1 as test')

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      url: databaseUrl.substring(0, 40) + '...',
      testQuery: result.rows
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: databaseUrl.substring(0, 40) + '...',
    }, { status: 500 })
  }
}
