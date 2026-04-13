'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CareHomeTable from '@/components/CareHomeTable'
import AgentRunButton from '@/components/AgentRunButton'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBanner from '@/components/ErrorBanner'
import type { CareHome } from '@/lib/types'

export default function CareHomesPage() {
  const [homes, setHomes] = useState<CareHome[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  const fetchHomes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (statusFilter) params.set('emailStatus', statusFilter)
      if (cityFilter) params.set('city', cityFilter)
      const res = await fetch(`/api/care-homes?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setHomes(data.homes)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load care homes')
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, cityFilter])

  useEffect(() => { fetchHomes() }, [fetchHomes])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Care Homes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} facilities in database</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/care-homes/import"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Import CSV
          </Link>
          <AgentRunButton />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder="Filter by city..."
          value={cityFilter}
          onChange={e => { setCityFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
          <option value="opted_out">Opted Out</option>
        </select>
        {(cityFilter || statusFilter) && (
          <button onClick={() => { setCityFilter(''); setStatusFilter(''); setPage(1) }} className="text-sm text-blue-600 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {isLoading && <LoadingSpinner message="Loading care homes..." />}
      {error && !isLoading && <ErrorBanner message={error} />}
      {!isLoading && !error && <CareHomeTable homes={homes} onRefresh={fetchHomes} />}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages} · {total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {/* Weekly schedule notice */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-700">
          The email agent runs automatically every <strong>Monday at 8:00 AM UTC</strong> and emails all care homes that haven't been contacted in the past 7 days.
          Invalid email addresses are skipped automatically.
        </p>
      </div>
    </main>
  )
}
