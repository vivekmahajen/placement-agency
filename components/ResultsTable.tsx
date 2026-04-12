'use client'

import { useState, useMemo } from 'react'
import type { Provider } from '@/lib/types'

type SortKey = keyof Pick<Provider, 'lastName' | 'professionLabel' | 'organizationName' | 'city' | 'phone'>
type SortDir = 'asc' | 'desc'

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
