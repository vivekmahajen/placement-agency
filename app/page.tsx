'use client'

import SearchForm from '@/components/SearchForm'
import ResultsTable from '@/components/ResultsTable'
import PaginationControls from '@/components/PaginationControls'
import ExportButton from '@/components/ExportButton'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBanner from '@/components/ErrorBanner'
import { useSearch } from '@/hooks/useSearch'

export default function Home() {
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

  const hasResults = providers.length > 0
  const hasSearched = lastQuery !== null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Placement Agency Portal</h1>
              <p className="text-sm text-gray-500">Find case managers, social workers &amp; discharge planners</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Form */}
        <SearchForm onSearch={search} isLoading={isLoading} />

        {/* Info notice */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-700">
            Provider data is sourced from the{' '}
            <span className="font-medium">NPPES National Provider Identifier Registry</span> (public federal database).
            Email addresses are not included in this registry and will show as <em>Not available</em>.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && <LoadingSpinner message="Searching the NPI Registry..." />}

        {/* Error state */}
        {error && !isLoading && <ErrorBanner message={error} />}

        {/* Warning */}
        {warning && !isLoading && (
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-yellow-700">{warning}</p>
          </div>
        )}

        {/* Empty state after search */}
        {!isLoading && !error && hasSearched && !hasResults && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-700 mb-1">No providers found</h3>
            <p className="text-sm text-gray-500">
              Try searching a nearby city, a different zip code, or broadening the profession filter.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && hasResults && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                Search Results
              </h2>
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
    </main>
  )
}
