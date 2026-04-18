import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import KeywordsManager from '@/components/dashboard/KeywordsManager'

export const metadata = { title: 'Keywords – UrgentMail' }

export default async function KeywordsPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login')

  const keywords = await prisma.keyword.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Keywords</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set the words and phrases the agent will watch for in your emails.
        </p>
      </div>
      <KeywordsManager
        initial={keywords.map(k => ({ ...k, createdAt: k.createdAt.toISOString() }))}
      />
    </div>
  )
}
