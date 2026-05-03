import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from './auth'

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password']

// API paths that don't require authentication
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/register']

export async function getAuthUser(request: NextRequest): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  avatar: string | null;
} | null> {
  const token = request.cookies.get('auth-token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) return null

  return getUserFromToken(token)
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return handler(request, user)
}

export function withRoles<T extends string>(
  allowedRoles: T[],
  handler: (
    request: NextRequest,
    user: { id: string; email: string; name: string; role: T; schoolId: string | null; avatar: string | null }
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    return withAuth(request, async (req, user) => {
      if (!allowedRoles.includes(user.role as T)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        )
      }
      return handler(req, user as typeof user & { role: T })
    })
  }
}

// Helper to get user from request headers (for client-side API calls)
export async function requireAuth(request: NextRequest): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  avatar: string | null;
} | null> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    // Try cookie
    const cookieToken = request.cookies.get('auth-token')?.value
    if (!cookieToken) return null
    return getUserFromToken(cookieToken)
  }

  return getUserFromToken(token)
}

// API response helpers
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}
