import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import EmailAccountsManager from '@/components/dashboard/EmailAccountsManager'

export const metadata = { title: 'Email Accounts – UrgentMail' }

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>
}) {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login')

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  })

  const { error, connected } = await searchParams

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
        <p className="text-gray-500 text-sm mt-1">
          Add the Gmail addresses you want monitored for urgent keywords. Each account requires Gmail
          authorization so the agent can read your inbox.
        </p>
      </div>
      <EmailAccountsManager
        initial={accounts.map(a => ({
          ...a,
          lastScannedAt: a.lastScannedAt?.toISOString() ?? null,
          tokenExpiry: undefined,
          accessToken: undefined,
          refreshToken: undefined,
          createdAt: a.createdAt.toISOString(),
        }))}
        errorParam={error}
        connectedParam={connected}
      />
    </div>
  )
}
