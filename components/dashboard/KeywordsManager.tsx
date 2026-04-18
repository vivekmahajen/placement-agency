'use client'
import { useState } from 'react'

type Keyword = { id: string; keyword: string; createdAt: string }

const SUGGESTIONS = [
  'URGENT', 'Extremely Urgent', 'ASAP', 'Immediate Action',
  'billing', 'bill alert', 'invoice due', 'payment overdue',
  'medical alert', 'lab results', 'appointment reminder',
  'account suspended', 'security alert', 'password reset',
]

export default function KeywordsManager({ initial }: { initial: Keyword[] }) {
  const [keywords, setKeywords] = useState<Keyword[]>(initial)
  const [newKw, setNewKw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(kw: string) {
    const trimmed = kw.trim()
    if (!trimmed) return
    setError('')
    setLoading(true)
    const res = await fetch('/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: trimmed }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setKeywords(k => [...k, data.keyword])
    setNewKw('')
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' })
    if (res.ok) setKeywords(k => k.filter(kw => kw.id !== id))
  }

  const existingSet = new Set(keywords.map(k => k.keyword.toLowerCase()))

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-200">{error}</div>}

      <form onSubmit={e => { e.preventDefault(); handleAdd(newKw) }} className="flex gap-3">
        <input
          value={newKw}
          onChange={e => setNewKw(e.target.value)}
          placeholder="Type a keyword and press Add…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={loading || !newKw.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Adding…' : '+ Add'}
        </button>
      </form>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Add Suggestions</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.filter(s => !existingSet.has(s.toLowerCase())).map(s => (
            <button key={s} onClick={() => handleAdd(s)}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 border border-gray-200 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      </div>

      {keywords.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200 text-gray-500">
          <p className="text-4xl mb-3">🔑</p>
          <p>No keywords yet. Add some above or click a suggestion.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Keywords ({keywords.length})</p>
          <div className="flex flex-wrap gap-2">
            {keywords.map(kw => (
              <span key={kw.id}
                className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 border border-orange-200 px-3 py-1.5 rounded-full text-sm font-medium">
                {kw.keyword}
                <button onClick={() => handleDelete(kw.id)}
                  className="text-orange-400 hover:text-red-600 font-bold leading-none" title="Remove">×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-sm text-blue-800">
        <strong>How it works:</strong> The agent searches every email in your connected Gmail accounts for these
        keywords in the subject line and body. Matches are reported in your daily 6 AM PST SMS summary.
      </div>
    </div>
  )
}
