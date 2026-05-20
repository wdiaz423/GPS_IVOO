import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { query } from '@/lib/db'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== 'google') {
        return false
      }

      try {
        const googleId = account.providerAccountId
        const email = user.email
        const name = user.name
        const image = user.image

        // Check if user exists
        const existingUser = await query(
          'SELECT id FROM users WHERE google_id = $1 OR email = $2',
          [googleId, email]
        )

        if (existingUser.rows.length === 0) {
          // Create new user
          await query(
            `INSERT INTO users (email, name, google_id, provider, profile_picture_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [email, name, googleId, 'google', image]
          )
        } else {
          // Update existing user with OAuth info if not already set
          const existingRow = existingUser.rows[0]
          if (!existingRow.google_id) {
            await query(
              'UPDATE users SET google_id = $1, provider = $2, profile_picture_url = $3 WHERE id = $4',
              [googleId, 'google', image, existingRow.id]
            )
          }
        }

        return true
      } catch (error) {
        console.error('[v0] NextAuth signIn callback error:', error)
        return false
      }
    },

    async jwt({ token, user, account }) {
      if (user && account?.provider === 'google') {
        token.googleId = account.providerAccountId
        token.provider = 'google'
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.provider = token.provider as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
})

export { handler as GET, handler as POST }
