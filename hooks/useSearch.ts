'use client'

import { useState, useCallback } from 'react'
import type { Provider, SearchQuery, SearchResult } from '@/lib/types'

interface SearchState {
  providers: Provider[]
  isLoading: boolean
  error: string | null
  warning: string | null
  currentPage: number
  hasMore: boolean
  totalFetched: number
  lastQuery: Omit<SearchQuery, 'page'> | null
}

const initialState: SearchState = {
  providers: [],
  isLoading: false,
  error: null,
  warning: null,
  currentPage: 1,
  hasMore: false,
  totalFetched: 0,
  lastQuery: null,
}

export function useSearch() {
  const [state, setState] = useState<SearchState>(initialState)

  const search = useCallback(
    async (query: Omit<SearchQuery, 'page'>, page = 1) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null, warning: null }))

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...query, page } satisfies SearchQuery),
        })

        const data = await res.json()

        if (!res.ok) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: data.error ?? 'Search failed. Please try again.',
          }))
          return
        }

        const result = data as SearchResult
        setState({
          providers: result.providers,
          isLoading: false,
          error: null,
          warning: result.warning ?? null,
          currentPage: page,
          hasMore: result.hasMore,
          totalFetched: result.totalFetched,
          lastQuery: query,
        })
      } catch {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Network error. Please check your connection and try again.',
        }))
      }
    },
    []
  )

  const goToPage = useCallback(
    (page: number) => {
      if (state.lastQuery) {
        search(state.lastQuery, page)
      }
    },
    [state.lastQuery, search]
  )

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return { ...state, search, goToPage, reset }
}
