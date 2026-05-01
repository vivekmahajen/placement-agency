import { NextResponse } from 'next/server'
import { getRecords } from '@/lib/storage'

export async function GET() {
  try {
    const records = getRecords()
    return NextResponse.json({ records })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}
