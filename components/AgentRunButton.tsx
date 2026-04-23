'use client'

import { useState } from 'react'
import type { AgentRunResult } from '@/lib/types'

export default function AgentRunButton() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<AgentRunResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_AGENT_SECRET ?? ''}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Agent failed')
      } else {
        setResult(data as AgentRunResult)
      }
    } catch {
      setError('Network error — could not reach the agent.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {isRunning ? 'Running Agent...' : 'Run Email Agent Now'}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {result && (
        <div className="text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-3 space-y-1">
          <p className="font-semibold text-green-800">Agent completed</p>
          <div className="text-green-700 grid grid-cols-2 gap-x-6 gap-y-0.5">
            <span>Attempted: <strong>{result.attempted}</strong></span>
            <span>Sent: <strong>{result.sent}</strong></span>
            <span>Skipped: <strong>{result.skipped}</strong></span>
            <span>Failed: <strong>{result.failed}</strong></span>
          </div>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-green-700 text-xs">View {result.errors.length} error(s)</summary>
              <ul className="mt-1 space-y-0.5">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">{e.homeName}: {e.error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
