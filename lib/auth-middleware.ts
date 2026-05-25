import { cookies } from 'next/headers'
import { queryOne } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function verifySession(req?: any) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('auth_session')?.value

    if (!sessionId) {
      return null
    }

    const session = queryOne(
      `SELECT s.user_id, u.email, u.name, u.role, s.expires_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > datetime('now')`,
      [sessionId]
    )

    if (!session) {
      return null
    }

    return {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
    }
  } catch (error) {
    console.error('[v0] Session verification error:', error)
    return null
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await verifySession(req)
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return user
}


