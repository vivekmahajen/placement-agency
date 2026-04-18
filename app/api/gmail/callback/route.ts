import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { exchangeCodeForTokens } from '@/lib/gmail'

export async function GET(request: Request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') ?? ''
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL('/dashboard/emails?error=gmail_denied', request.url)
    )
  }

  const [emailAccountId, userId] = state.split(':')
  if (userId !== session.userId) {
    return NextResponse.redirect(new URL('/dashboard/emails?error=state_mismatch', request.url))
  }

  const account = await prisma.emailAccount.findUnique({ where: { id: emailAccountId } })
  if (!account || account.userId !== session.userId) {
    return NextResponse.redirect(new URL('/dashboard/emails?error=not_found', request.url))
  }

  const tokens = await exchangeCodeForTokens(code)
  await prisma.emailAccount.update({
    where: { id: emailAccountId },
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.tokenExpiry,
      isConnected: true,
    },
  })

  return NextResponse.redirect(new URL('/dashboard/emails?connected=true', request.url))
}
