import { NextResponse } from 'next/server'
import { runWeeklyAgent } from '@/lib/email-agent'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const bearer = request.headers.get('authorization')?.replace('Bearer ', '')
  const isAuthorized = isVercelCron || bearer === process.env.AGENT_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWeeklyAgent()
    return NextResponse.json(result)
  } catch (err) {
    console.error('Agent run error:', err)
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 })
  }
}
