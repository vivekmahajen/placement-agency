import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ accounts })
}

export async function POST(request: Request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { emailAddress } = await request.json()
  if (!emailAddress) {
    return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
  }

  const existing = await prisma.emailAccount.findUnique({
    where: { userId_emailAddress: { userId: session.userId, emailAddress } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Email account already registered' }, { status: 409 })
  }

  const account = await prisma.emailAccount.create({
    data: { userId: session.userId, emailAddress },
  })
  return NextResponse.json({ account }, { status: 201 })
}
