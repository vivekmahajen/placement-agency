'use client'

import { useState } from 'react'
import type { CaseRecord } from '@/lib/types'

interface Props {
  records: CaseRecord[]
}

const TITLE_COLORS: Record<string, string> = {
  'Social Worker': 'bg-purple-50 text-purple-700',
  'Case Manager': 'bg-blue-50 text-blue-700',
  'Discharge Planner': 'bg-orange-50 text-orange-700',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + '…'
}

function ExpandableCell({ text, max = 100 }: { text: string; max?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= max) return <span>{text}</span>
  return (
    <span>
      {expanded ? text : truncate(text, max)}{' '}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-teal-600 hover:text-teal-800 text-xs font-medium underline-offset-2 hover:underline"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  )
}

export default function CasesTable({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
        <svg
          className="w-10 h-10 text-gray-300 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500">No cases recorded yet</p>
        <p className="text-xs text-gray-400 mt-1">Submit a pain point above to create the first record.</p>
      </div>
    )
  }

  const thClass =
    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap'
  const tdClass = 'px-4 py-3 text-sm text-gray-700 align-top'

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={thClass}>Date</th>
            <th className={thClass}>Title</th>
            <th className={thClass}>Name</th>
            <th className={thClass}>Location</th>
            <th className={thClass}>Question / Pain Point</th>
            <th className={thClass}>Solution Summary</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
              <td className={`${tdClass} whitespace-nowrap text-gray-400 text-xs`}>
                {formatDate(r.createdAt)}
              </td>
              <td className={tdClass}>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TITLE_COLORS[r.title] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {r.title}
                </span>
              </td>
              <td className={tdClass}>
                <div className="font-medium text-gray-900">{r.name}</div>
                {r.facility && (
                  <div className="text-xs text-gray-400 mt-0.5">{r.facility}</div>
                )}
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <div>{r.location || '—'}</div>
                {r.capacity && (
                  <div className="text-xs text-gray-400">{r.capacity} capacity</div>
                )}
              </td>
              <td className={tdClass} style={{ maxWidth: '280px' }}>
                <ExpandableCell text={r.painPoint} max={120} />
              </td>
              <td className={tdClass} style={{ maxWidth: '320px' }}>
                <ExpandableCell text={r.solution} max={150} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
