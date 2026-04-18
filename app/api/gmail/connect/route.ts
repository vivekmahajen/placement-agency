import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET(request: Request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { searchParams } = new URL(request.url)
  const emailAccountId = searchParams.get('emailAccountId')
  if (!emailAccountId) {
    return NextResponse.json({ error: 'emailAccountId required' }, { status: 400 })
  }

  const account = await prisma.emailAccount.findUnique({ where: { id: emailAccountId } })
  if (!account || account.userId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const state = `${emailAccountId}:${session.userId}`
  const authUrl = getGmailAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
