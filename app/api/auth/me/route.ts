import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await verifySession(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[v0] Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
