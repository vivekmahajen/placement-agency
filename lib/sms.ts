import twilio from 'twilio'

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

export async function sendSMS(to: string, body: string): Promise<void> {
  const client = getClient()
  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

export function formatDailySummary(
  userName: string,
  date: string,
  matches: Array<{ subject: string; senderName: string; matchedKeywords: string[] }>
): string {
  if (matches.length === 0) {
    return `UrgentMail: No urgent emails found for ${date}. Have a great day, ${userName.split(' ')[0]}!`
  }

  const lines = [
    `UrgentMail Daily Summary - ${date}`,
    `Hi ${userName.split(' ')[0]}, you have ${matches.length} urgent email(s) from yesterday:`,
    '',
  ]

  matches.slice(0, 5).forEach((m, i) => {
    const keywords = m.matchedKeywords.join(', ')
    lines.push(`${i + 1}. [${keywords}] ${m.subject} (from ${m.senderName})`)
  })

  if (matches.length > 5) {
    lines.push(`...and ${matches.length - 5} more. Login to view all.`)
  }

  lines.push('')
  lines.push('Reply STOP to unsubscribe.')

  return lines.join('\n')
}
