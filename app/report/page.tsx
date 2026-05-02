import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { getRecords } from '@/lib/storage'
import Footer from '@/components/Footer'
import type { CaseRecord } from '@/lib/types'

const TITLE_COLORS: Record<string, string> = {
  'Social Worker': 'bg-purple-50 text-purple-700',
  'Case Manager': 'bg-blue-50 text-blue-700',
  'Discharge Planner': 'bg-orange-50 text-orange-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function truncate(text: string, max = 200) {
  return text.length <= max ? text : text.slice(0, max) + '…'
}

export default async function ReportPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user) redirect('/login')

  const records = await getRecords()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Affordable Golden Years</h1>
                <p className="text-sm text-gray-500">A placement agency for Seniors &mdash; Pain Point &amp; Solutions Report</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-teal-600 font-medium hover:underline">
                ← Back to Analyzer
              </Link>
              <span className="text-sm text-gray-500">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Cases', value: records.length, color: 'text-teal-600' },
            { label: 'Social Workers', value: records.filter(r => r.title === 'Social Worker').length, color: 'text-purple-600' },
            { label: 'Case Managers', value: records.filter(r => r.title === 'Case Manager').length, color: 'text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Report table */}
        {records.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <p className="text-gray-500 font-medium">No cases recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record: CaseRecord) => (
              <div key={record.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TITLE_COLORS[record.title] ?? 'bg-gray-100 text-gray-700'}`}>
                      {record.title}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{record.name}</span>
                      {record.facility && <span className="text-xs text-gray-400 ml-2">{record.facility}</span>}
                    </div>
                    {record.location && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {record.location}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(record.createdAt)}</span>
                </div>

                {/* Card body */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <div className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pain Point</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{truncate(record.painPoint, 300)}</p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">AI Solution</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{truncate(record.solution, 400)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
