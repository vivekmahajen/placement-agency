import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { hashPassword, createToken, COOKIE_NAME } from '@/lib/auth'
import { findUserByEmail, createUser } from '@/lib/storage'
import type { ProfessionalTitle } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { email, password, name, title } = await request.json()

    if (!email || !password || !name || !title) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await findUserByEmail(email.toLowerCase())
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const id = randomUUID()
    const passwordHash = await hashPassword(password)
    const createdAt = new Date().toISOString()

    await createUser({ id, email: email.toLowerCase(), name, title: title as ProfessionalTitle, passwordHash, createdAt })

    const token = await createToken({ userId: id, email: email.toLowerCase(), name, title: title as ProfessionalTitle })

    const response = NextResponse.json({ success: true, name })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Registration failed: ${message}` }, { status: 500 })
  }
}
