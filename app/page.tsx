'use client'

import { useState, useEffect } from 'react'
import AgentForm from '@/components/AgentForm'
import SolutionPanel from '@/components/SolutionPanel'
import CasesTable from '@/components/CasesTable'
import SearchForm from '@/components/SearchForm'
import ResultsTable from '@/components/ResultsTable'
import PaginationControls from '@/components/PaginationControls'
import ExportButton from '@/components/ExportButton'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBanner from '@/components/ErrorBanner'
import { useSearch } from '@/hooks/useSearch'
import type { CaseRecord } from '@/lib/types'

type Tab = 'analyzer' | 'search'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('analyzer')

  // Pain point analyzer state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [solution, setSolution] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [records, setRecords] = useState<CaseRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)

  // NPI provider search state
  const {
    providers,
    isLoading,
    error,
    warning,
    currentPage,
    hasMore,
    totalFetched,
    lastQuery,
    search,
    goToPage,
  } = useSearch()

  useEffect(() => {
    fetch('/api/records')
      .then((r) => r.json())
      .then((data: { records: CaseRecord[] }) => {
        setRecords(data.records ?? [])
      })
      .catch(() => {})
      .finally(() => setRecordsLoading(false))
  }, [])

  function handleSolutionStart() {
    setIsAnalyzing(true)
    setSolution('')
    setIsStreaming(true)
    setIsDone(false)
    setAnalyzeError(null)
  }

  function handleSolutionDelta(text: string) {
    setSolution((prev) => prev + text)
  }

  function handleSolutionDone(record: CaseRecord) {
    setIsAnalyzing(false)
    setIsStreaming(false)
    setIsDone(true)
    setRecords((prev) => [record, ...prev])
  }

  function handleError(message: string) {
    setIsAnalyzing(false)
    setIsStreaming(false)
    setAnalyzeError(message)
  }

  const hasResults = providers.length > 0
  const hasSearched = lastQuery !== null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Care Placement Agency</h1>
              <p className="text-sm text-gray-500">
                AI-powered solutions for discharge planners, case managers &amp; social workers
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-0" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analyzer'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
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
              Pain Point Analyzer
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
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
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              Provider Search
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
            {/* Intro banner */}
            <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <svg
                className="w-5 h-5 text-teal-600 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-teal-800">
                Describe your care placement challenge and our AI agent will search for the best
                available solutions, resources, and strategies — tailored to your specific situation.
              </p>
            </div>

            {/* Form */}
            <AgentForm
              isAnalyzing={isAnalyzing}
              onSolutionStart={handleSolutionStart}
              onSolutionDelta={handleSolutionDelta}
              onSolutionDone={handleSolutionDone}
              onError={handleError}
            />

            {/* Solution */}
            <SolutionPanel
              solution={solution}
              isStreaming={isStreaming}
              isDone={isDone}
              error={analyzeError}
            />

            {/* Records table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Case Records
                  {records.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({records.length})
                    </span>
                  )}
                </h2>
              </div>
              {recordsLoading ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
                  <p className="text-sm text-gray-400">Loading records…</p>
                </div>
              ) : (
                <CasesTable records={records} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Form */}
            <SearchForm onSearch={search} isLoading={isLoading} />

            {/* Info notice */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <svg
                className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-amber-700">
                Provider data is sourced from the{' '}
                <span className="font-medium">NPPES National Provider Identifier Registry</span>{' '}
                (public federal database). Email addresses are not included in this registry and
                will show as <em>Not available</em>.
              </p>
            </div>

            {/* Loading state */}
            {isLoading && <LoadingSpinner message="Searching the NPI Registry..." />}

            {/* Error state */}
            {error && !isLoading && <ErrorBanner message={error} />}

            {/* Warning */}
            {warning && !isLoading && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                <svg
                  className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <p className="text-sm text-yellow-700">{warning}</p>
              </div>
            )}

            {/* Empty state after search */}
            {!isLoading && !error && hasSearched && !hasResults && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  No providers found
                </h3>
                <p className="text-sm text-gray-500">
                  Try searching a nearby city, a different zip code, or broadening the profession
                  filter.
                </p>
              </div>
            )}

            {/* Results */}
            {!isLoading && hasResults && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-gray-900">Search Results</h2>
                  <ExportButton providers={providers} />
                </div>
                <ResultsTable providers={providers} />
                <PaginationControls
                  currentPage={currentPage}
                  hasMore={hasMore}
                  isLoading={isLoading}
                  totalOnPage={totalFetched}
                  onPrev={() => goToPage(currentPage - 1)}
                  onNext={() => goToPage(currentPage + 1)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
