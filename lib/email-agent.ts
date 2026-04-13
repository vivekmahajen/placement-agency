import sgMail from '@sendgrid/mail'
import { getCareHomesToEmail, insertEmailLog, updateCareHomeEmailStatus, markEmailInvalid } from './db-queries'
import { buildAvailabilityRequestEmail } from './email-template'
import type { AgentRunResult, CareHome } from './types'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendToHome(home: CareHome): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!home.email || !isValidEmail(home.email)) {
    markEmailInvalid(home.id)
    return { success: false, error: 'invalid_email' }
  }

  const { subject, text, html, replyTo } = buildAvailabilityRequestEmail(home)

  try {
    const [response] = await sgMail.send({
      to: home.email.trim(),
      from: process.env.SENDGRID_FROM_EMAIL ?? '',
      replyTo,
      subject,
      text,
      html,
    })

    const messageId = response.headers['x-message-id'] as string | undefined
    return { success: true, messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function runWeeklyAgent(): Promise<AgentRunResult> {
  const homes = getCareHomesToEmail()
  const result: AgentRunResult = {
    attempted: homes.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  }

  for (const home of homes) {
    if (!home.email) {
      result.skipped++
      continue
    }

    if (!isValidEmail(home.email)) {
      result.skipped++
      markEmailInvalid(home.id)
      result.errors.push({ homeId: home.id, homeName: home.name, error: 'invalid_email' })
      continue
    }

    const { success, messageId, error } = await sendToHome(home)

    if (success) {
      insertEmailLog({
        care_home_id: home.id,
        sendgrid_message_id: messageId,
        subject: `Bed Availability Request – ${home.name}`,
      })
      updateCareHomeEmailStatus(home.id, 'sent', new Date().toISOString())
      result.sent++
    } else {
      result.failed++
      result.errors.push({ homeId: home.id, homeName: home.name, error: error ?? 'send_failed' })
    }

    // 200ms delay between emails to respect SendGrid rate limits
    await sleep(200)
  }

  return result
}
