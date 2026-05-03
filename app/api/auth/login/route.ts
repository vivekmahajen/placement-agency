import { NextResponse } from 'next/server'
import { verifyPassword, createToken, COOKIE_NAME } from '@/lib/auth'
import { findUserByEmail } from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await findUserByEmail(email.toLowerCase())
    if (!user) {
      const usingDb = Boolean(process.env.POSTGRES_URL)
      return NextResponse.json({
        error: `Invalid email or password${usingDb ? '' : ' (note: using temporary storage — user data is lost on redeploy; connect Vercel Postgres to persist accounts)'}`,
      }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createToken({ userId: user.id, email: user.email, name: user.name, title: user.title })

    const response = NextResponse.json({ success: true, name: user.name })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
