'use client'

import { useState, useEffect, useCallback } from 'react'
import AvailabilityTable from '@/components/AvailabilityTable'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBanner from '@/components/ErrorBanner'
import type { BedWithHome } from '@/lib/types'

export default function AvailabilityPage() {
  const [beds, setBeds] = useState<BedWithHome[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [roomType, setRoomType] = useState('')
  const [gender, setGender] = useState('')
  const [maxCost, setMaxCost] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  const fetchBeds = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (city) params.set('city', city)
      if (roomType) params.set('roomType', roomType)
      if (gender) params.set('gender', gender)
      if (maxCost) params.set('maxCost', maxCost)
      const res = await fetch(`/api/availability?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setBeds(data.beds)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability')
    } finally {
      setIsLoading(false)
    }
  }, [page, city, roomType, gender, maxCost])

  useEffect(() => { fetchBeds() }, [fetchBeds])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bed Availability</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} open bed{total !== 1 ? 's' : ''} reported by care homes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder="Filter by city..."
          value={city}
          onChange={e => { setCity(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={roomType} onChange={e => { setRoomType(e.target.value); setPage(1) }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Any Room Type</option>
          <option value="private">Private</option>
          <option value="shared">Shared</option>
        </select>
        <select value={gender} onChange={e => { setGender(e.target.value); setPage(1) }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Any Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input
          type="number"
          placeholder="Max monthly cost ($)"
          value={maxCost}
          onChange={e => { setMaxCost(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
        />
        {(city || roomType || gender || maxCost) && (
          <button onClick={() => { setCity(''); setRoomType(''); setGender(''); setMaxCost(''); setPage(1) }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
        )}
      </div>

      {isLoading && <LoadingSpinner message="Loading bed availability..." />}
      {error && !isLoading && <ErrorBanner message={error} />}
      {!isLoading && !error && <AvailabilityTable beds={beds} />}

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
