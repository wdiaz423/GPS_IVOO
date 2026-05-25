import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await queryOne('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Create user
    const userId = nanoid()
    const now = new Date().toISOString()

    const result = await query(
      `INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, role`,
      [userId, email, password_hash, name, 'owner', now, now]
    )

    const user = result.rows[0]

    // Create session
    const sessionId = nanoid()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await query(
      `INSERT INTO sessions (id, user_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, userId, expiresAt, now]
    )

    // Set session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )

    response.cookies.set('auth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
