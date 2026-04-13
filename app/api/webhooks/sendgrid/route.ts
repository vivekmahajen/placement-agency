import { NextResponse } from 'next/server'
import { updateEmailLogReply, insertAvailabilityReport, insertBed, updateCareHomeEmailStatus } from '@/lib/db-queries'
import { parseReplyWithClaude } from '@/lib/reply-parser'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Security: verify shared secret passed as query param
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.SENDGRID_WEBHOOK_SECRET && secret !== process.env.SENDGRID_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const to = formData.get('to') as string ?? ''
  const text = formData.get('text') as string ?? ''
  const html = formData.get('html') as string ?? ''
  const rawBody = text || html || ''

  // Extract care_home_id from reply+{id}@... address
  const match = to.match(/reply\+(\d+)@/)
  const careHomeId = match ? parseInt(match[1], 10) : null

  if (!careHomeId) {
    console.warn('Sendgrid webhook: could not identify care home from to:', to)
    // Return 200 so SendGrid does not retry
    return NextResponse.json({ ok: true, warning: 'Could not identify care home' })
  }

  const repliedAt = new Date().toISOString()

  // Store raw reply on email log
  const emailLogId = updateEmailLogReply(careHomeId, rawBody, repliedAt)

  // Parse with Claude
  const parsed = await parseReplyWithClaude(rawBody)

  // Handle opt-out
  if (parsed.opted_out) {
    updateCareHomeEmailStatus(careHomeId, 'opted_out')
    return NextResponse.json({ ok: true, action: 'opted_out' })
  }

  // Insert availability report
  const reportId = insertAvailabilityReport({
    care_home_id: careHomeId,
    email_log_id: emailLogId ?? undefined,
    total_open_beds: parsed.total_open_beds ?? undefined,
    raw_reply: rawBody,
    parsed_by: parsed.confidence === 'low' ? 'claude_low_confidence' : 'claude',
  })

  // Insert individual bed records
  for (const bed of parsed.beds) {
    insertBed({
      availability_report_id: reportId,
      care_home_id: careHomeId,
      room_type: bed.room_type,
      base_cost: bed.base_cost,
      gender_accommodation: bed.gender_accommodation,
      notes: bed.notes,
    })
  }

  updateCareHomeEmailStatus(careHomeId, 'replied')

  return NextResponse.json({ ok: true, reportId, bedsInserted: parsed.beds.length })
}
