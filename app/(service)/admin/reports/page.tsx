import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import ReportsTable from '@/components/admin/ReportsTable'

export const metadata = { title: 'Reports – UrgentMail Admin' }

export default async function ReportsPage() {
  const session = await getCurrentUser()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const allUsers = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Urgent emails found per customer per month
          </p>
        </div>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">← Back to Admin</Link>
      </div>

      <ReportsTable allUsers={allUsers} />
    </div>
  )
}
