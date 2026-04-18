import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import SubscriptionManager from '@/components/dashboard/SubscriptionManager'
import { PRICE_PER_EMAIL_PER_MONTH, MIN_MONTHS } from '@/app/api/subscription/route'

export const metadata = { title: 'Subscription – UrgentMail' }

export default async function SubscriptionPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login')

  const [sub, emailCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.userId } }),
    prisma.emailAccount.count({ where: { userId: session.userId, isActive: true } }),
  ])

  const totalMonthly = emailCount * PRICE_PER_EMAIL_PER_MONTH
  const totalUpfront = totalMonthly * MIN_MONTHS

  const initial = {
    subscription: sub
      ? {
          ...sub,
          trialEndDate: sub.trialEndDate.toISOString(),
          paidUntil: sub.paidUntil?.toISOString() ?? null,
        }
      : null,
    emailCount,
    totalMonthly,
    totalUpfront,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your UrgentMail service plan.</p>
      </div>
      <Suspense>
        <SubscriptionManager initial={initial} />
      </Suspense>
    </div>
  )
}
