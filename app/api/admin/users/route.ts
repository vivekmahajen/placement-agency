import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getCurrentUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: {
      subscription: true,
      emailAccounts: { where: { isActive: true }, select: { id: true } },
      _count: { select: { keywords: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      emailCount: u.emailAccounts.length,
      keywordCount: u._count.keywords,
      subscription: u.subscription,
    })),
  })
}
