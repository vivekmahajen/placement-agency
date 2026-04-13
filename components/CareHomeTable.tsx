'use client'

import { useState } from 'react'
import type { CareHome } from '@/lib/types'

interface Props {
  homes: CareHome[]
  onRefresh: () => void
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-600',
  sent:      'bg-blue-50 text-blue-700',
  replied:   'bg-green-50 text-green-700',
  opted_out: 'bg-red-50 text-red-600',
}

export default function CareHomeTable({ homes, onRefresh }: Props) {
  const [sending, setSending] = useState<number | null>(null)
  const [sendResult, setSendResult] = useState<Record<number, 'ok' | 'err'>>({})

  async function handleSendEmail(id: number) {
    setSending(id)
    try {
      const res = await fetch(`/api/care-homes/${id}/email`, { method: 'POST' })
      setSendResult(prev => ({ ...prev, [id]: res.ok ? 'ok' : 'err' }))
      if (res.ok) onRefresh()
    } catch {
      setSendResult(prev => ({ ...prev, [id]: 'err' }))
    } finally {
      setSending(null)
    }
  }

  if (homes.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
        </svg>
        <p className="text-gray-500 text-sm">No care homes yet. Import a CSV to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Facility Name', 'City', 'Phone', 'Email', 'Status', 'Last Emailed', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {homes.map(home => (
            <tr key={home.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{home.name}</div>
                {home.address && <div className="text-xs text-gray-400">{home.address}</div>}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {home.city}{home.state ? `, ${home.state}` : ''}
                {home.zip && <div className="text-xs text-gray-400">{home.zip}</div>}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {home.phone ? (
                  <a href={`tel:${home.phone.replace(/\D/g,'')}`} className="text-blue-600 hover:underline">{home.phone}</a>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 text-sm">
                {home.email ? (
                  <div>
                    <span className="text-gray-700">{home.email}</span>
                    {home.email_valid === 0 && (
                      <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600">Invalid</span>
                    )}
                  </div>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[home.email_status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {home.email_status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {home.last_emailed_at ? new Date(home.last_emailed_at).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3">
                {home.email && home.email_valid !== 0 ? (
                  <button
                    onClick={() => handleSendEmail(home.id)}
                    disabled={sending === home.id}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      sendResult[home.id] === 'ok'
                        ? 'bg-green-100 text-green-700'
                        : sendResult[home.id] === 'err'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50'
                    }`}
                  >
                    {sending === home.id ? 'Sending...' : sendResult[home.id] === 'ok' ? 'Sent!' : sendResult[home.id] === 'err' ? 'Failed' : 'Send Email'}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">No email</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
