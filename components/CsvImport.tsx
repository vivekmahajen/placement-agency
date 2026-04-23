'use client'

import { useState, useRef } from 'react'

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

interface Props {
  onImported: () => void
}

export default function CsvImport({ onImported }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a .csv file')
      return
    }

    setIsUploading(true)
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/care-homes/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Import failed')
      } else {
        setResult(data as ImportResult)
        onImported()
      }
    } catch {
      setError('Network error — upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-gray-700">{isUploading ? 'Uploading...' : 'Drag & drop a CSV file here, or click to browse'}</p>
        <p className="text-xs text-gray-500 mt-1">Expected columns: name, address, city, state, zip, phone, email</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-green-800">Import complete</p>
          <p className="text-sm text-green-700">
            <strong>{result.imported}</strong> imported &nbsp;·&nbsp; <strong>{result.skipped}</strong> skipped (missing name)
          </p>
          {result.errors.length > 0 && (
            <details className="mt-1">
              <summary className="text-xs text-green-700 cursor-pointer">{result.errors.length} row error(s)</summary>
              <ul className="mt-1 space-y-0.5">
                {result.errors.map((e, i) => <li key={i} className="text-xs text-red-600">{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
