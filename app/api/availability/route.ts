import { NextResponse } from 'next/server'
import { getAvailability } from '@/lib/db-queries'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') ?? undefined
  const roomType = searchParams.get('roomType') ?? undefined
  const gender = searchParams.get('gender') ?? undefined
  const maxCost = searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

  try {
    const result = getAvailability({ city, roomType, gender, maxCost, page, pageSize })
    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/availability error:', err)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
