import { NextResponse } from 'next/server'
import { getCareHomeById, insertEmailLog, updateCareHomeEmailStatus, markEmailInvalid } from '@/lib/db-queries'
import { buildAvailabilityRequestEmail } from '@/lib/email-template'
import sgMail from '@sendgrid/mail'

export const dynamic = 'force-dynamic'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

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

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    return NextResponse.json({ error: 'SendGrid is not configured. Add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to .env.local' }, { status: 503 })
  }

  const { subject, text, html, replyTo } = buildAvailabilityRequestEmail(home)

  try {
    const [response] = await sgMail.send({
      to: home.email.trim(),
      from: process.env.SENDGRID_FROM_EMAIL,
      replyTo,
      subject,
      text,
      html,
    })

    const messageId = response.headers['x-message-id'] as string | undefined

    insertEmailLog({ care_home_id: homeId, sendgrid_message_id: messageId, subject })
    updateCareHomeEmailStatus(homeId, 'sent', new Date().toISOString())

    return NextResponse.json({ success: true, messageId })
  } catch (err) {
    console.error(`Failed to send email to care home ${homeId}:`, err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }
}
