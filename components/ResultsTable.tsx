'use client'

import { useState, useMemo } from 'react'
import type { Provider } from '@/lib/types'

type SortKey = keyof Pick<Provider, 'lastName' | 'professionLabel' | 'organizationName' | 'city' | 'phone'>
type SortDir = 'asc' | 'desc'

function buildLinkedInUrl(provider: Provider): string {
  const parts = [
    provider.firstName,
    provider.lastName,
    provider.professionLabel,
    provider.organizationName,
    provider.city,
    provider.state,
  ].filter(Boolean).join(' ')
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(parts)}`
}

interface Props {
  providers: Provider[]
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-300 ml-1">↕</span>
  return <span className="text-blue-600 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function ResultsTable({ providers }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('lastName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...providers].sort((a, b) => {
      const av = (a[sortKey] ?? '').toLowerCase()
      const bv = (b[sortKey] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [providers, sortKey, sortDir])

  if (providers.length === 0) return null

  const thClass =
    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap'
  const tdClass = 'px-4 py-3 text-sm text-gray-700 align-top'

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={thClass} onClick={() => handleSort('lastName')}>
              Name <SortIcon active={sortKey === 'lastName'} dir={sortDir} />
            </th>
            <th className={thClass} onClick={() => handleSort('professionLabel')}>
              Profession <SortIcon active={sortKey === 'professionLabel'} dir={sortDir} />
            </th>
            <th className={thClass} onClick={() => handleSort('organizationName')}>
              Organization <SortIcon active={sortKey === 'organizationName'} dir={sortDir} />
            </th>
            <th className={thClass} onClick={() => handleSort('phone')}>
              Phone <SortIcon active={sortKey === 'phone'} dir={sortDir} />
            </th>
            <th className={thClass} onClick={() => handleSort('city')}>
              Location <SortIcon active={sortKey === 'city'} dir={sortDir} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Verify
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sorted.map((p) => (
            <tr key={p.npi} className="hover:bg-gray-50 transition-colors">
              <td className={tdClass}>
                <div className="font-medium text-gray-900">
                  {p.lastName}{p.firstName ? `, ${p.firstName}` : ''}
                </div>
                {p.credential && (
                  <div className="text-xs text-gray-400">{p.credential}</div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">NPI: {p.npi}</div>
              </td>
              <td className={tdClass}>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {p.professionLabel}
                </span>
              </td>
              <td className={tdClass}>
                {p.organizationName ? (
                  <div className="flex items-start gap-1.5">
                    <span>{p.organizationName}</span>
                    {p.source === 'npi+places' && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100">
                        +Places
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className={tdClass}>
                {p.phone ? (
                  <a
                    href={`tel:${p.phone.replace(/\D/g, '')}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.phone}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className={tdClass}>
                <div>{p.city}{p.state ? `, ${p.state}` : ''}</div>
                {p.zip && <div className="text-xs text-gray-400">{p.zip}</div>}
              </td>
              <td className={tdClass}>
                <span className="text-gray-400 text-xs italic">Not available</span>
              </td>
              <td className={tdClass}>
                <a
                  href={buildLinkedInUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors whitespace-nowrap"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Search
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
