'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CsvImport from '@/components/CsvImport'

export default function ImportPage() {
  const router = useRouter()

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/care-homes" className="text-sm text-blue-600 hover:underline">← Back to Care Homes</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Care Homes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload a CSV file to add or update care home records.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <CsvImport onImported={() => router.push('/care-homes')} />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
        <p className="text-sm font-medium text-amber-800">CSV Format Tips</p>
        <ul className="text-sm text-amber-700 list-disc list-inside space-y-0.5">
          <li>First row must be column headers</li>
          <li>Required column: <code className="bg-amber-100 px-1 rounded">name</code> (or <code className="bg-amber-100 px-1 rounded">facility_name</code>)</li>
          <li>Optional: <code className="bg-amber-100 px-1 rounded">address</code>, <code className="bg-amber-100 px-1 rounded">city</code>, <code className="bg-amber-100 px-1 rounded">state</code>, <code className="bg-amber-100 px-1 rounded">zip</code>, <code className="bg-amber-100 px-1 rounded">phone</code>, <code className="bg-amber-100 px-1 rounded">email</code></li>
          <li>Existing records matched by email or name+city are updated, not duplicated</li>
          <li>State defaults to CA if not provided</li>
        </ul>
      </div>
    </main>
  )
}
