import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

// Debug endpoint to check login issues
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!databaseUrl || !authToken) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  }

  const db = createClient({
    url: databaseUrl,
    authToken: authToken,
  })

  try {
    // Get the admin user
    const result = await db.execute({
      sql: "SELECT * FROM User WHERE email = ?",
      args: ['admin@smzedu.com']
    })

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        users: await db.execute("SELECT email FROM User")
      })
    }

    const user = result.rows[0]
    const storedPassword = user.password as string

    // Test password comparison
    const testPassword = 'password123'
    const isValid = await bcrypt.compare(testPassword, storedPassword)

    // Also test with a fresh hash
    const freshHash = await bcrypt.hash(testPassword, 12)
    const freshCompare = await bcrypt.compare(testPassword, freshHash)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      },
      passwordCheck: {
        storedHash: storedPassword,
        testPassword: testPassword,
        isValid: isValid,
        hashLength: storedPassword.length,
        hashPrefix: storedPassword.substring(0, 10)
      },
      freshHashTest: {
        freshHash: freshHash,
        freshCompare: freshCompare
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
