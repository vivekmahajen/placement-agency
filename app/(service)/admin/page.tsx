import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Admin – UrgentMail' }

export default async function AdminPage() {
  const session = await getCurrentUser()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const [totalUsers, activeTrials, activeSubscriptions, totalMatches] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.subscription.count({ where: { status: 'TRIAL', trialEndDate: { gte: new Date() } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE', paidUntil: { gte: new Date() } } }),
    prisma.emailMatch.count(),
  ])

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    include: {
      subscription: true,
      emailAccounts: { where: { isActive: true }, select: { id: true, isConnected: true } },
      _count: { select: { keywords: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const now = new Date()

  function subStatus(sub: { status: string; trialEndDate: Date; paidUntil: Date | null } | null) {
    if (!sub) return { label: 'No Sub', color: 'gray' }
    if (sub.status === 'TRIAL') {
      return now <= sub.trialEndDate
        ? { label: 'Trial', color: 'blue' }
        : { label: 'Trial Expired', color: 'red' }
    }
    if (sub.status === 'ACTIVE' && sub.paidUntil && now <= sub.paidUntil) {
      return { label: 'Active', color: 'green' }
    }
    return { label: 'Expired', color: 'red' }
  }

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all UrgentMail customers</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: '👥' },
          { label: 'Active Trials', value: activeTrials, icon: '🕐' },
          { label: 'Paid Subscriptions', value: activeSubscriptions, icon: '✅' },
          { label: 'Total Matches Found', value: totalMatches, icon: '⚡' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-xl mb-1">{c.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
        <Link href="/admin/reports" className="text-sm text-blue-600 hover:underline font-medium">
          View Monthly Reports →
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Name</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Email / Phone</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Subscription</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Accounts</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Keywords</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => {
              const status = subStatus(u.subscription)
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-4">
                    <div className="text-gray-900">{u.email}</div>
                    <div className="text-gray-500 text-xs">{u.phone}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${colorMap[status.color]}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {u.emailAccounts.length} ({u.emailAccounts.filter(a => a.isConnected).length} connected)
                  </td>
                  <td className="px-5 py-4 text-gray-700">{u._count.keywords}</td>
                  <td className="px-5 py-4 text-gray-500">{u.createdAt.toLocaleDateString()}</td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-500">No users yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
