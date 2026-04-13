import { NextResponse } from 'next/server'
import { getCareHomeById, insertEmailLog, updateCareHomeEmailStatus, markEmailInvalid } from '@/lib/db-queries'
import { buildAvailabilityRequestEmail } from '@/lib/email-template'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const homeId = parseInt(id, 10)

  if (isNaN(homeId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const home = getCareHomeById(homeId)
  if (!home) {
    return NextResponse.json({ error: 'Care home not found' }, { status: 404 })
  }

  if (!home.email) {
    return NextResponse.json({ error: 'No email address on file for this care home' }, { status: 400 })
  }

  if (!isValidEmail(home.email)) {
    markEmailInvalid(homeId)
    return NextResponse.json({ error: 'Email address is invalid' }, { status: 400 })
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ error: 'Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local' }, { status: 503 })
  }

  const { subject, text, html, replyTo } = buildAvailabilityRequestEmail(home)

  try {
    const { messageId } = await sendMail({ to: home.email.trim(), subject, text, html, replyTo })

    insertEmailLog({ care_home_id: homeId, sendgrid_message_id: messageId, subject })
    updateCareHomeEmailStatus(homeId, 'sent', new Date().toISOString())

    return NextResponse.json({ success: true, messageId })
  } catch (err) {
    console.error(`Failed to send email to care home ${homeId}:`, err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }
}
