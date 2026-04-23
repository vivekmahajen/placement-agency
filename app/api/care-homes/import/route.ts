import { NextResponse } from 'next/server'
import { parseCsvText } from '@/lib/csv-parser'
import { upsertCareHome } from '@/lib/db-queries'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const { rows, skipped, errors } = parseCsvText(text)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV', details: errors }, { status: 400 })
    }

    let imported = 0
    const importErrors: string[] = [...errors]

    for (const row of rows) {
      try {
        upsertCareHome({
          name: row.name,
          address: row.address ?? null,
          city: row.city ?? null,
          state: row.state ?? 'CA',
          zip: row.zip ?? null,
          phone: row.phone ?? null,
          email: row.email ?? null,
          website: row.website ?? null,
          source: 'csv',
          email_status: 'pending',
          email_valid: 1,
          last_emailed_at: null,
        })
        imported++
      } catch (err) {
        importErrors.push(`Row "${row.name}": ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ imported, skipped, errors: importErrors })
  } catch (err) {
    console.error('POST /api/care-homes/import error:', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
