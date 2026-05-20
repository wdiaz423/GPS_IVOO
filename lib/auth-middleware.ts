import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createHash } from 'crypto'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number
    email: string
    full_name: string
    role: string
  }
}

export async function verifySession(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value

    if (!sessionToken) {
      return null
    }

    const tokenHash = createHash('sha256').update(sessionToken).digest('hex')

    const result = await query(
      `SELECT s.user_id, u.email, u.full_name, u.role, s.expires_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash]
    )

    if (result.rows.length === 0) {
      return null
    }

    const session = result.rows[0]
    return {
      id: session.user_id,
      email: session.email,
      full_name: session.full_name,
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
