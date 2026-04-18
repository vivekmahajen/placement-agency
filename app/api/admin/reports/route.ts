import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getCurrentUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const users = await prisma.user.findMany({
    where: userId ? { id: userId } : {},
    include: {
      emailAccounts: {
        include: {
          emailMatches: {
            orderBy: { receivedAt: 'asc' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const reports = users.map(user => {
    const allMatches = user.emailAccounts.flatMap(a => a.emailMatches)

    // Group by year-month
    const byMonth: Record<string, { emailsFound: number; smsSent: number }> = {}
    for (const match of allMatches) {
      const key = match.receivedAt.toISOString().slice(0, 7) // "YYYY-MM"
      if (!byMonth[key]) byMonth[key] = { emailsFound: 0, smsSent: 0 }
      byMonth[key].emailsFound++
      if (match.smsSent) byMonth[key].smsSent++
    }

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      emailAccounts: user.emailAccounts.map(a => a.emailAddress),
      monthlyReport: Object.entries(byMonth)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, stats]) => ({ month, ...stats })),
      totalEmailsFound: allMatches.length,
    }
  })

  const allUsers = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ reports, allUsers })
}
