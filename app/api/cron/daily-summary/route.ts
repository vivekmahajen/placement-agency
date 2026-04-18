import { NextResponse } from 'next/server'
import { runDailyScan } from '@/lib/email-scanner'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runDailyScan()
  return NextResponse.json({ success: true, ...result })
}
