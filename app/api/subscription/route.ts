import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const PRICE_PER_EMAIL_PER_MONTH = 4.99
export const MIN_MONTHS = 12

export async function GET() {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await prisma.subscription.findUnique({ where: { userId: session.userId } })
  const emailCount = await prisma.emailAccount.count({
    where: { userId: session.userId, isActive: true },
  })

  const totalMonthly = emailCount * PRICE_PER_EMAIL_PER_MONTH
  const totalUpfront = totalMonthly * MIN_MONTHS

  return NextResponse.json({ subscription: sub, emailCount, totalMonthly, totalUpfront })
}
