import { NextResponse } from 'next/server'

// Debug endpoint to check environment variables (remove in production)
export async function GET() {
  const envStatus = {
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    // Show first 20 chars of URL to verify format (don't expose full token)
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 30) || 'N/A',
  }

  return NextResponse.json(envStatus, { status: 200 })
}
