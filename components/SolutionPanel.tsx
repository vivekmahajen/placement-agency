'use client'

import { useEffect, useRef } from 'react'

interface Props {
  solution: string
  isStreaming: boolean
  isDone: boolean
  error: string | null
}

export default function SolutionPanel({ solution, isStreaming, isDone, error }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [solution, isStreaming])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
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
        <div>
          <p className="text-sm font-semibold text-red-800">Analysis failed</p>
          <p className="text-sm text-red-700 mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  if (!solution && !isStreaming) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-teal-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-white"
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
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI-Powered Solution</h3>
            <p className="text-xs text-gray-500">
              {isStreaming ? 'Searching and analyzing...' : 'Analysis complete'}
            </p>
          </div>
        </div>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-teal-700 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            Live
          </span>
        )}
        {isDone && (
          <span className="flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Complete
          </span>
        )}
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
          {solution}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-teal-500 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
