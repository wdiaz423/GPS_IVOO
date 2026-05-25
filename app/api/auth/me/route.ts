import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { queryOne } from '@/lib/db'
import { createHash } from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('auth_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: session.user_id,
        email: session.email,
        name: session.full_name,
        role: session.role,
      }
    })
  } catch (error) {
    console.error('[v0] Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
