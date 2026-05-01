'use client'

import { useState } from 'react'
import type { AnalyzeRequest, CaseRecord, ProfessionalTitle } from '@/lib/types'

const TITLES: ProfessionalTitle[] = ['Social Worker', 'Case Manager', 'Discharge Planner']

interface Props {
  onSolutionDelta: (text: string) => void
  onSolutionDone: (record: CaseRecord) => void
  onSolutionStart: () => void
  onError: (message: string) => void
  isAnalyzing: boolean
}

export default function AgentForm({
  onSolutionDelta,
  onSolutionDone,
  onSolutionStart,
  onError,
  isAnalyzing,
}: Props) {
  const [title, setTitle] = useState<ProfessionalTitle>('Discharge Planner')
  const [name, setName] = useState('')
  const [facility, setFacility] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [painPoint, setPainPoint] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setValidationError('Please enter your name.')
      return
    }
    if (!painPoint.trim()) {
      setValidationError('Please describe your pain point or challenge.')
      return
    }
    setValidationError(null)
    onSolutionStart()

    const payload: AnalyzeRequest = {
      title,
      name: name.trim(),
      facility: facility.trim(),
      location: location.trim(),
      capacity: capacity.trim(),
      painPoint: painPoint.trim(),
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok || !response.body) {
        onError('Failed to connect to the analysis service. Please try again.')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6)) as
              | { type: 'delta'; text: string }
              | { type: 'done'; record: CaseRecord }
              | { type: 'error'; message: string }

            if (data.type === 'delta') {
              onSolutionDelta(data.text)
            } else if (data.type === 'done') {
              onSolutionDone(data.record)
              setPainPoint('')
              setName('')
              setFacility('')
              setLocation('')
              setCapacity('')
            } else if (data.type === 'error') {
              onError(data.message)
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch {
      onError('Network error. Please check your connection and try again.')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5"
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900">Your Professional Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Tell us about yourself so we can tailor solutions to your specific context.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Professional Title *</label>
          <select
            value={title}
            onChange={(e) => setTitle(e.target.value as ProfessionalTitle)}
            className={`${inputClass} bg-white`}
          >
            {TITLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Your Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Facility / Organization</label>
          <input
            type="text"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            placeholder="e.g. Memorial Regional Hospital"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Location (City, State)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin, TX"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Facility Capacity (beds / patients)</label>
          <input
            type="text"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g. 250 beds, 40-bed SNF unit"
            className={inputClass}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label className={labelClass}>
          Describe Your Pain Point or Challenge *
        </label>
        <textarea
          value={painPoint}
          onChange={(e) => setPainPoint(e.target.value)}
          rows={5}
          placeholder="Describe the specific challenge you're facing when placing patients in care homes. Be as detailed as possible — e.g. difficulty finding SNF beds for complex patients, families refusing placement, insurance authorization delays, lack of available memory care units..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {validationError && (
        <p className="text-red-600 text-sm">{validationError}</p>
      )}

      <button
        type="submit"
        disabled={isAnalyzing}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Find Solutions
          </>
        )}
      </button>
    </form>
  )
}
