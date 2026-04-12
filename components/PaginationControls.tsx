'use client'

interface Props {
  currentPage: number
  hasMore: boolean
  isLoading: boolean
  totalOnPage: number
  onPrev: () => void
  onNext: () => void
}

export default function PaginationControls({
  currentPage,
  hasMore,
  isLoading,
  totalOnPage,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Page {currentPage} &mdash; {totalOnPage} result{totalOnPage !== 1 ? 's' : ''} on this page
        {!hasMore && currentPage === 1 && ' (all results)'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage <= 1 || isLoading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          &larr; Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore || isLoading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  )
}
