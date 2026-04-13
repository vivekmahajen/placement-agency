import { NextResponse } from 'next/server'
import { getCareHomes } from '@/lib/db-queries'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') ?? undefined
  const emailStatus = searchParams.get('emailStatus') ?? undefined
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

  try {
    const result = getCareHomes({ city, emailStatus, page, pageSize })
    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/care-homes error:', err)
    return NextResponse.json({ error: 'Failed to fetch care homes' }, { status: 500 })
  }
}
