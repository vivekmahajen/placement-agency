import type { CareHome } from './types'

export function getReplyToAddress(careHomeId: number): string {
  const domain = process.env.SENDGRID_REPLY_TO_EMAIL ?? 'replies.example.com'
  return `reply+${careHomeId}@${domain}`
}

export function buildAvailabilityRequestEmail(home: CareHome): {
  subject: string
  text: string
  html: string
  replyTo: string
} {
  const subject = `Bed Availability Request – ${home.name}`
  const replyTo = getReplyToAddress(home.id)

  // TODO: Replace with final email content provided by user
  const text = `Dear ${home.name} Team,

We are a senior placement agency that helps families find available care home beds in California. To keep our directory current, we would appreciate a brief reply with your current availability.

Please reply to this email with the following information:

1. How many beds do you currently have open?

2. For each open bed, please provide:
   - Room type (private room or shared room)
   - Base monthly cost ($)
   - Gender accommodation (male only / female only / both genders accepted)

3. Please confirm or correct your facility information:
   - Facility name: ${home.name}
   - Address: ${[home.address, home.city, home.state, home.zip].filter(Boolean).join(', ')}
   - Phone: ${home.phone ?? 'Not on file'}
   - Email: ${home.email ?? 'Not on file'}

You can simply reply to this email with the information above. Your response helps families in need find the right care as quickly as possible.

To be removed from our mailing list, simply reply with "unsubscribe" or "remove me."

Thank you for your time and for the care you provide to seniors.

Warm regards,
The Placement Agency Team`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Dear <strong>${escHtml(home.name)}</strong> Team,</p>

  <p>We are a senior placement agency that helps families find available care home beds in California.
  To keep our directory current, we would appreciate a brief reply with your current availability.</p>

  <p><strong>Please reply to this email with the following information:</strong></p>

  <ol>
    <li style="margin-bottom: 8px;"><strong>How many beds do you currently have open?</strong></li>
    <li style="margin-bottom: 8px;"><strong>For each open bed, please provide:</strong>
      <ul>
        <li>Room type (private room or shared room)</li>
        <li>Base monthly cost ($)</li>
        <li>Gender accommodation (male only / female only / both genders accepted)</li>
      </ul>
    </li>
    <li style="margin-bottom: 8px;"><strong>Please confirm or correct your facility information:</strong>
      <ul>
        <li>Facility name: ${escHtml(home.name)}</li>
        <li>Address: ${escHtml([home.address, home.city, home.state, home.zip].filter(Boolean).join(', '))}</li>
        <li>Phone: ${escHtml(home.phone ?? 'Not on file')}</li>
        <li>Email: ${escHtml(home.email ?? 'Not on file')}</li>
      </ul>
    </li>
  </ol>

  <p>You can simply reply to this email with the information above. Your response helps families in need find the right care as quickly as possible.</p>

  <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; margin-top: 24px; padding-top: 12px;">
    To be removed from our mailing list, simply reply with "unsubscribe" or "remove me."
  </p>

  <p>Thank you for your time and for the care you provide to seniors.</p>
  <p>Warm regards,<br><strong>The Placement Agency Team</strong></p>
</body>
</html>`

  return { subject, text, html, replyTo }
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
