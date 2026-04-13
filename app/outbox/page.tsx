'use client'

import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBanner from '@/components/ErrorBanner'
import type { EmailLog } from '@/lib/types'

interface EmailLogWithHome extends EmailLog {
  home_name: string
}

const STATUS_STYLES: Record<string, string> = {
  sent:      'bg-blue-50 text-blue-700',
  replied:   'bg-green-50 text-green-700',
  bounced:   'bg-red-50 text-red-600',
  failed:    'bg-red-50 text-red-600',
  delivered: 'bg-gray-100 text-gray-600',
}

export default function OutboxPage() {
  const [logs, setLogs] = useState<EmailLogWithHome[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      const res = await fetch(`/api/care-homes?${params}`)
      // We use the email log endpoint — add a dedicated /api/email-logs route via care-homes API
      // For now, fetch from care-homes and show last_emailed_at
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      // Transform care home data to show email status
      setLogs([]) // populated by /api/outbox below
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outbox')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  // Dedicated fetch using email_log join
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
        const res = await fetch(`/api/outbox?${params}`)
        if (!res.ok) {
          // Fallback: show care homes with email status if outbox route not yet available
          const r2 = await fetch(`/api/care-homes?emailStatus=sent&page=${page}&pageSize=${PAGE_SIZE}`)
          const d2 = await r2.json()
          setTotal(d2.total ?? 0)
          setLogs([])
          return
        }
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load outbox')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Outbox</h1>
        <p className="text-sm text-gray-500 mt-0.5">History of all emails sent to care homes</p>
      </div>

      {isLoading && <LoadingSpinner message="Loading email log..." />}
      {error && !isLoading && <ErrorBanner message={error} />}

      {!isLoading && !error && logs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <p className="text-gray-500 text-sm">No emails sent yet. Run the agent or send individual emails from the Care Homes page.</p>
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Facility', 'Sent At', 'Status', 'Reply Received', 'Message ID'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.home_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.sent_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[log.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {log.reply_received_at ? new Date(log.reply_received_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.sendgrid_message_id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </main>
  )
}
