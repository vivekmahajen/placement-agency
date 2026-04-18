'use client'
import { useState, useEffect } from 'react'

type MonthlyRow = { month: string; emailsFound: number; smsSent: number }
type UserReport = {
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  emailAccounts: string[]
  monthlyReport: MonthlyRow[]
  totalEmailsFound: number
}
type AllUser = { id: string; name: string; email: string }

export default function ReportsTable({ allUsers }: { allUsers: AllUser[] }) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [report, setReport] = useState<UserReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedUserId) { setReport(null); return }
    setLoading(true)
    fetch(`/api/admin/reports?userId=${selectedUserId}`)
      .then(r => r.json())
      .then(d => {
        setReport(d.reports?.[0] ?? null)
        setLoading(false)
      })
  }, [selectedUserId])

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <label className="text-sm font-medium text-gray-700">Select Customer:</label>
        <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— All customers —</option>
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-gray-500 text-sm">Loading…</div>}

      {report && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-semibold text-gray-900">{report.userName}</p>
            </div>
            <div>
              <p className="text-gray-500">Email / Phone</p>
              <p className="font-medium">{report.userEmail}</p>
              <p className="text-gray-600">{report.userPhone}</p>
            </div>
            <div>
              <p className="text-gray-500">Monitored Email Accounts</p>
              {report.emailAccounts.map(e => (
                <p key={e} className="font-medium text-blue-700">{e}</p>
              ))}
            </div>
            <div>
              <p className="text-gray-500">Total Urgent Emails Found</p>
              <p className="text-3xl font-bold text-gray-900">{report.totalEmailsFound}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Monthly Report – {report.userName}</h3>
            </div>
            {report.monthlyReport.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-500">No data yet for this customer</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Month</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-700">Urgent Emails Found</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-700">SMS Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.monthlyReport.map(row => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {new Date(row.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-900 font-semibold">{row.emailsFound}</td>
                      <td className="px-5 py-4 text-right text-gray-600">{row.smsSent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!selectedUserId && !loading && (
        <AllCustomersReport allUsers={allUsers} />
      )}
    </div>
  )
}

function AllCustomersReport({ allUsers }: { allUsers: AllUser[] }) {
  const [reports, setReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/reports')
      .then(r => r.json())
      .then(d => { setReports(d.reports ?? []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-gray-500 text-sm">Loading all customers…</div>

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">All Customers Summary</h3>
        <p className="text-xs text-gray-500 mt-0.5">{allUsers.length} customer(s)</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-5 py-3 font-semibold text-gray-700">Customer</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-700">Email / Phone</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-700">Monitored Accounts</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-700">Total Matches</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reports.map(r => (
            <tr key={r.userId} className="hover:bg-gray-50">
              <td className="px-5 py-4 font-medium text-gray-900">{r.userName}</td>
              <td className="px-5 py-4">
                <div>{r.userEmail}</div>
                <div className="text-gray-500 text-xs">{r.userPhone}</div>
              </td>
              <td className="px-5 py-4 text-gray-700">{r.emailAccounts.join(', ') || '—'}</td>
              <td className="px-5 py-4 text-right font-bold text-gray-900">{r.totalEmailsFound}</td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-500">No data yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
