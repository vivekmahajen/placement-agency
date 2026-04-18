import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Dashboard – UrgentMail' }

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const urgent = daysLeft <= 5
  return (
    <div className={`rounded-xl p-4 flex items-center justify-between ${urgent ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
      <div>
        <p className={`font-semibold ${urgent ? 'text-red-700' : 'text-blue-700'}`}>
          {daysLeft > 0 ? `Free trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Free trial ended'}
        </p>
        <p className={`text-sm mt-0.5 ${urgent ? 'text-red-600' : 'text-blue-600'}`}>
          $4.99 per email/month × 12 months billed upfront after trial
        </p>
      </div>
      <Link href="/dashboard/subscription"
        className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${urgent ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
        {daysLeft > 0 ? 'View Plan' : 'Subscribe Now'}
      </Link>
    </div>
  )
}

function ActiveBanner({ paidUntil }: { paidUntil: Date }) {
  return (
    <div className="rounded-xl p-4 bg-green-50 border border-green-200 flex items-center justify-between">
      <div>
        <p className="font-semibold text-green-700">Subscription active</p>
        <p className="text-sm text-green-600 mt-0.5">Paid through {paidUntil.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <span className="text-green-600 text-2xl">✓</span>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login')

  const [user, emailCount, keywordCount, matchCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, include: { subscription: true } }),
    prisma.emailAccount.count({ where: { userId: session.userId, isActive: true } }),
    prisma.keyword.count({ where: { userId: session.userId } }),
    prisma.emailMatch.count({
      where: {
        emailAccount: { userId: session.userId },
        receivedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  if (!user) redirect('/auth/login')

  const sub = user.subscription
  const now = new Date()
  const isActive = sub?.status === 'ACTIVE' && sub.paidUntil && now <= sub.paidUntil
  const isTrial = sub?.status === 'TRIAL' && now <= (sub.trialEndDate ?? now)
  const daysLeft = sub?.trialEndDate
    ? Math.max(0, Math.ceil((sub.trialEndDate.getTime() - now.getTime()) / 86400000))
    : 0

  const recentMatches = await prisma.emailMatch.findMany({
    where: { emailAccount: { userId: session.userId } },
    include: { emailAccount: { select: { emailAddress: true } } },
    orderBy: { receivedAt: 'desc' },
    take: 5,
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">{user.email} · {user.phone}</p>
      </div>

      {isActive && sub.paidUntil && <ActiveBanner paidUntil={sub.paidUntil} />}
      {isTrial && !isActive && <TrialBanner daysLeft={daysLeft} />}
      {!isTrial && !isActive && (
        <div className="rounded-xl p-4 bg-red-50 border border-red-200 flex items-center justify-between">
          <p className="font-semibold text-red-700">Subscription expired — service paused</p>
          <Link href="/dashboard/subscription" className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Renew</Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Email Accounts', value: emailCount, href: '/dashboard/emails', icon: '📬' },
          { label: 'Keywords', value: keywordCount, href: '/dashboard/keywords', icon: '🔑' },
          { label: 'Urgent Emails (7d)', value: matchCount, href: null, icon: '⚡' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
            {card.href && (
              <Link href={card.href} className="text-xs text-blue-600 hover:underline mt-2 inline-block">Manage →</Link>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Urgent Emails</h2>
        </div>
        {recentMatches.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p>No urgent emails found yet.</p>
            <p className="text-sm mt-1">
              {emailCount === 0 ? (
                <Link href="/dashboard/emails" className="text-blue-600 hover:underline">Add an email account</Link>
              ) : keywordCount === 0 ? (
                <Link href="/dashboard/keywords" className="text-blue-600 hover:underline">Add keywords</Link>
              ) : 'Scans run daily at 6 AM PST'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentMatches.map(m => (
              <div key={m.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{m.subject}</p>
                  <p className="text-sm text-gray-500">{m.senderName} · {m.emailAccount.emailAddress}</p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0">
                  {(JSON.parse(m.matchedKeywords) as string[]).map(k => (
                    <span key={k} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{k}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-400 shrink-0">{new Date(m.receivedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-1">📱 Daily SMS Summary</h3>
        <p className="text-sm text-blue-700">
          You will receive a text at <strong>6:00 AM PST</strong> every morning with a summary of urgent emails
          found in the previous day. Texts are sent to <strong>{user.phone}</strong>.
        </p>
      </div>
    </div>
  )
}
