import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { scanEmailAccountForMatches } from '@/lib/email-scanner'

export async function POST(request: Request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { emailAccountId } = await request.json()

  const account = await prisma.emailAccount.findUnique({ where: { id: emailAccountId } })
  if (!account || account.userId !== session.userId) {
    return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
  }
  if (!account.isConnected) {
    return NextResponse.json({ error: 'Gmail not connected for this account' }, { status: 400 })
  }

  const newMatches = await scanEmailAccountForMatches(emailAccountId)
  return NextResponse.json({ newMatches })
}

export async function GET(request: Request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: session.userId },
    select: { id: true },
  })
  const accountIds = accounts.map(a => a.id)

  const matches = await prisma.emailMatch.findMany({
    where: { emailAccountId: { in: accountIds } },
    orderBy: { receivedAt: 'desc' },
    take: limit,
    include: { emailAccount: { select: { emailAddress: true } } },
  })

  return NextResponse.json({
    matches: matches.map(m => ({
      ...m,
      matchedKeywords: JSON.parse(m.matchedKeywords) as string[],
    })),
  })
}
