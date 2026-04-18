import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keywords = await prisma.keyword.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ keywords })
}

export async function POST(request: Request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { keyword } = await request.json()
  if (!keyword?.trim()) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
  }

  const normalised = keyword.trim()
  const existing = await prisma.keyword.findUnique({
    where: { userId_keyword: { userId: session.userId, keyword: normalised } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Keyword already exists' }, { status: 409 })
  }

  const kw = await prisma.keyword.create({
    data: { userId: session.userId, keyword: normalised },
  })
  return NextResponse.json({ keyword: kw }, { status: 201 })
}
