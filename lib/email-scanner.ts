import { prisma } from './db'
import { scanEmailsForKeywords } from './gmail'
import { sendSMS, formatDailySummary } from './sms'

function getYesterdayPST(): Date {
  const now = new Date()
  // PST is UTC-8 (or PDT UTC-7; using UTC-8 for simplicity)
  const pstOffset = 8 * 60 * 60 * 1000
  const pstNow = new Date(now.getTime() - pstOffset)
  const yesterday = new Date(pstNow)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  return new Date(yesterday.getTime() + pstOffset)
}

export async function scanEmailAccountForMatches(emailAccountId: string): Promise<number> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
    include: {
      user: { include: { keywords: true } },
    },
  })

  if (!account || !account.isConnected || !account.accessToken || !account.refreshToken) {
    return 0
  }

  const keywords = account.user.keywords.map(k => k.keyword)
  if (!keywords.length) return 0

  const since = getYesterdayPST()
  const scanned = await scanEmailsForKeywords(
    account.accessToken,
    account.refreshToken,
    keywords,
    since
  )

  let newMatches = 0
  for (const email of scanned) {
    try {
      await prisma.emailMatch.upsert({
        where: {
          emailAccountId_gmailMessageId: {
            emailAccountId: account.id,
            gmailMessageId: email.gmailMessageId,
          },
        },
        update: {},
        create: {
          emailAccountId: account.id,
          gmailMessageId: email.gmailMessageId,
          subject: email.subject,
          senderName: email.senderName,
          senderEmail: email.senderEmail,
          receivedAt: email.receivedAt,
          matchedKeywords: JSON.stringify(email.matchedKeywords),
          snippet: email.snippet,
        },
      })
      newMatches++
    } catch {
      // Skip duplicates
    }
  }

  await prisma.emailAccount.update({
    where: { id: emailAccountId },
    data: { lastScannedAt: new Date() },
  })

  return newMatches
}

export async function sendDailySummaryForUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      emailAccounts: {
        where: { isActive: true, isConnected: true },
      },
    },
  })

  if (!user || !user.phone) return

  const yesterday = getYesterdayPST()
  const today = new Date(yesterday)
  today.setDate(today.getDate() + 1)

  const matches = await prisma.emailMatch.findMany({
    where: {
      emailAccountId: { in: user.emailAccounts.map(a => a.id) },
      receivedAt: { gte: yesterday, lt: today },
      smsSent: false,
    },
    orderBy: { receivedAt: 'desc' },
  })

  const matchData = matches.map(m => ({
    subject: m.subject,
    senderName: m.senderName,
    matchedKeywords: JSON.parse(m.matchedKeywords) as string[],
  }))

  const dateStr = yesterday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  })

  const message = formatDailySummary(user.name, dateStr, matchData)
  await sendSMS(user.phone, message)

  if (matches.length > 0) {
    await prisma.emailMatch.updateMany({
      where: { id: { in: matches.map(m => m.id) } },
      data: { smsSent: true, smsSentAt: new Date() },
    })
  }
}

export async function runDailyScan(): Promise<{ scanned: number; smsCount: number }> {
  const activeAccounts = await prisma.emailAccount.findMany({
    where: { isActive: true, isConnected: true },
    include: {
      user: {
        include: {
          subscription: true,
          keywords: true,
        },
      },
    },
  })

  let scanned = 0
  const userIds = new Set<string>()

  for (const account of activeAccounts) {
    const sub = account.user.subscription
    const isSubscriptionValid =
      sub &&
      (sub.status === 'TRIAL'
        ? new Date() <= sub.trialEndDate
        : sub.status === 'ACTIVE' && sub.paidUntil && new Date() <= sub.paidUntil)

    if (!isSubscriptionValid) continue

    try {
      await scanEmailAccountForMatches(account.id)
      scanned++
      userIds.add(account.userId)
    } catch (err) {
      console.error(`Failed to scan account ${account.id}:`, err)
    }
  }

  let smsCount = 0
  for (const userId of userIds) {
    try {
      await sendDailySummaryForUser(userId)
      smsCount++
    } catch (err) {
      console.error(`Failed to send SMS for user ${userId}:`, err)
    }
  }

  return { scanned, smsCount }
}
