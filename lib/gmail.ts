import { google } from 'googleapis'

export interface GmailTokens {
  accessToken: string
  refreshToken: string
  tokenExpiry: Date
}

export interface ScannedEmail {
  gmailMessageId: string
  subject: string
  senderName: string
  senderEmail: string
  receivedAt: Date
  matchedKeywords: string[]
  snippet: string
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getGmailAuthUrl(state: string): string {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state,
    prompt: 'consent',
  })
}

export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
  const client = getOAuth2Client()
  const { tokens } = await client.getToken(code)
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain Gmail tokens')
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
  }
}

function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^"?([^"<]+)"?\s*<?([^>]+@[^>]+)>?$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: raw, email: raw }
}

function buildSearchQuery(keywords: string[], since: Date): string {
  const dateStr = since.toISOString().split('T')[0].replace(/-/g, '/')
  const keywordQuery = keywords.map(k => `"${k}"`).join(' OR ')
  return `after:${dateStr} (${keywordQuery})`
}

export async function scanEmailsForKeywords(
  accessToken: string,
  refreshToken: string,
  keywords: string[],
  since: Date
): Promise<ScannedEmail[]> {
  if (!keywords.length) return []

  const client = getOAuth2Client()
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })

  const gmail = google.gmail({ version: 'v1', auth: client })
  const query = buildSearchQuery(keywords, since)

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 100,
  })

  const messages = listRes.data.messages ?? []
  const results: ScannedEmail[] = []

  for (const msg of messages) {
    if (!msg.id) continue
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date'],
    })

    const headers = full.data.payload?.headers ?? []
    const subject = headers.find(h => h.name === 'Subject')?.value ?? '(no subject)'
    const from = headers.find(h => h.name === 'From')?.value ?? ''
    const dateHeader = headers.find(h => h.name === 'Date')?.value

    const { name: senderName, email: senderEmail } = parseEmailAddress(from)
    const receivedAt = dateHeader ? new Date(dateHeader) : new Date()
    const snippet = full.data.snippet ?? ''

    const lowerSubject = subject.toLowerCase()
    const lowerSnippet = snippet.toLowerCase()
    const matched = keywords.filter(
      k => lowerSubject.includes(k.toLowerCase()) || lowerSnippet.includes(k.toLowerCase())
    )

    if (matched.length > 0) {
      results.push({
        gmailMessageId: msg.id,
        subject,
        senderName,
        senderEmail,
        receivedAt,
        matchedKeywords: matched,
        snippet,
      })
    }
  }

  return results
}
