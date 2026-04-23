import { NextResponse } from 'next/server'
import { getEmailLogs } from '@/lib/db-queries'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)
  const careHomeId = searchParams.get('careHomeId') ? parseInt(searchParams.get('careHomeId')!, 10) : undefined

  try {
    const result = getEmailLogs({ careHomeId, page, pageSize })
    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/outbox error:', err)
    return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 })
  }
}
