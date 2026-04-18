import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth'

const TRIAL_DAYS = 30

export async function POST(request: Request) {
  const { name, email, phone, password } = await request.json()

  if (!name || !email || !phone || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const isAdmin = email === process.env.ADMIN_EMAIL
  const passwordHash = await hashPassword(password)

  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: isAdmin ? 'ADMIN' : 'USER',
      subscription: {
        create: {
          status: 'TRIAL',
          trialStartDate: new Date(),
          trialEndDate,
        },
      },
    },
  })

  const token = await signToken({ userId: user.id, email: user.email, role: user.role })

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
