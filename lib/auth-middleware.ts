import { cookies } from 'next/headers'
import { queryOne } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function verifySession(req?: any) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('auth_session')?.value

    if (!sessionToken) {
      return null
    }

    const tokenHash = createHash('sha256').update(sessionToken).digest('hex')

    const session = await queryOne(
      `SELECT s.user_id, u.email, u.full_name, u.role, s.expires_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash]
    )

    if (!session) {
      return null
    }

    return {
      id: session.user_id,
      email: session.email,
      name: session.full_name,
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


