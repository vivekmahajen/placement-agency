'use client'

import { useState } from 'react'
import type { SearchQuery } from '@/lib/types'
import { US_STATES } from '@/lib/constants'

type SearchMode = 'city_state' | 'zip'

interface Props {
  onSearch: (query: Omit<SearchQuery, 'page'>) => void
  isLoading: boolean
}

export default function SearchForm({ onSearch, isLoading }: Props) {
  const [mode, setMode] = useState<SearchMode>('city_state')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [profession, setProfession] = useState<SearchQuery['profession']>('all')
  const [validationError, setValidationError] = useState<string | null>(null)

  function validate(): string | null {
    if (mode === 'zip') {
      if (!/^\d{5}$/.test(zip)) return 'Please enter a valid 5-digit zip code.'
    } else {
      if (!city.trim()) return 'Please enter a city.'
      if (!state) return 'Please select a state.'
    }
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)

    if (mode === 'zip') {
      onSearch({ zip: zip.trim(), profession })
    } else {
      onSearch({ city: city.trim(), state, profession })
    }
  }

  function switchMode(newMode: SearchMode) {
    setMode(newMode)
    setValidationError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
      {/* Search mode tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => switchMode('city_state')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'city_state'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          City &amp; State
        </button>
        <button
          type="button"
          onClick={() => switchMode('zip')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'zip'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Zip Code
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mode === 'city_state' ? (
          <>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Austin"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s.abbr} value={s.abbr}>
                    {s.abbr} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code
            </label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="e.g. 78701"
              maxLength={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className={mode === 'zip' ? 'sm:col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profession
          </label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value as SearchQuery['profession'])}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Professions</option>
            <option value="social_worker">Social Worker</option>
            <option value="case_manager">Case Manager / Discharge Planner</option>
          </select>
        </div>
      </div>

      {validationError && (
        <p className="text-red-600 text-sm">{validationError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
