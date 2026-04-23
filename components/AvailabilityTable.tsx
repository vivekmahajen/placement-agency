'use client'

import { useState, useMemo } from 'react'
import type { BedWithHome } from '@/lib/types'

interface Props {
  beds: BedWithHome[]
}

type SortKey = 'home_name' | 'home_city' | 'room_type' | 'base_cost' | 'gender_accommodation' | 'reported_at'

function formatCost(cost: number | null): string {
  if (cost == null) return '—'
  return `$${cost.toLocaleString()}/mo`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

export default function AvailabilityTable({ beds }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('reported_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    return [...beds].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [beds, sortKey, sortDir])

  if (beds.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
        <p className="text-gray-500 text-sm">No bed availability data yet. Responses will appear here after care homes reply.</p>
      </div>
    )
  }

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap'
  const tdClass = 'px-4 py-3 text-sm text-gray-700 align-top'

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={thClass} onClick={() => handleSort('home_name')}>Facility <SortIcon col="home_name" /></th>
            <th className={thClass} onClick={() => handleSort('home_city')}>City <SortIcon col="home_city" /></th>
            <th className={thClass} onClick={() => handleSort('room_type')}>Room Type <SortIcon col="room_type" /></th>
            <th className={thClass} onClick={() => handleSort('base_cost')}>Base Cost <SortIcon col="base_cost" /></th>
            <th className={thClass} onClick={() => handleSort('gender_accommodation')}>Gender <SortIcon col="gender_accommodation" /></th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
            <th className={thClass} onClick={() => handleSort('reported_at')}>Reported <SortIcon col="reported_at" /></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sorted.map(bed => (
            <tr key={bed.id} className="hover:bg-gray-50 transition-colors">
              <td className={tdClass}>
                <div className="font-medium text-gray-900">{bed.home_name}</div>
                {bed.home_address && <div className="text-xs text-gray-400">{bed.home_address}</div>}
              </td>
              <td className={tdClass}>{bed.home_city ?? '—'}</td>
              <td className={tdClass}>
                {bed.room_type ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    bed.room_type === 'private' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                    {bed.room_type}
                  </span>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className={tdClass}>
                <span className="font-medium text-gray-900">{formatCost(bed.base_cost)}</span>
              </td>
              <td className={tdClass}>
                {bed.gender_accommodation ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    bed.gender_accommodation === 'male' ? 'bg-blue-50 text-blue-700'
                    : bed.gender_accommodation === 'female' ? 'bg-pink-50 text-pink-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {bed.gender_accommodation}
                  </span>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className={tdClass}>
                {bed.home_phone && <div><a href={`tel:${bed.home_phone.replace(/\D/g,'')}`} className="text-blue-600 hover:underline text-xs">{bed.home_phone}</a></div>}
                {bed.home_email && <div className="text-xs text-gray-500">{bed.home_email}</div>}
              </td>
              <td className={tdClass}>
                <span className="text-xs text-gray-500">{formatDate(bed.reported_at)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
