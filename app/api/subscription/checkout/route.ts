import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PRICE_PER_EMAIL_PER_MONTH, MIN_MONTHS } from '../route'

export async function POST() {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

  const emailCount = await prisma.emailAccount.count({
    where: { userId: session.userId, isActive: true },
  })
  if (emailCount === 0) {
    return NextResponse.json({ error: 'Add at least one email account first' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  const totalCents = Math.round(emailCount * PRICE_PER_EMAIL_PER_MONTH * MIN_MONTHS * 100)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'UrgentMail Forwarding Service',
            description: `${emailCount} email account(s) × $${PRICE_PER_EMAIL_PER_MONTH}/mo × ${MIN_MONTHS} months`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: user?.email,
    success_url: `${appUrl}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/subscription?cancelled=true`,
    metadata: { userId: session.userId, emailCount: String(emailCount) },
  })

  return NextResponse.json({ url: checkoutSession.url })
}

export async function GET(request: Request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

  if (checkoutSession.payment_status === 'paid' && checkoutSession.metadata?.userId === session.userId) {
    const paidUntil = new Date()
    paidUntil.setMonth(paidUntil.getMonth() + MIN_MONTHS)

    await prisma.subscription.update({
      where: { userId: session.userId },
      data: {
        status: 'ACTIVE',
        paidUntil,
        stripeSessionId: sessionId,
        totalPaid: (checkoutSession.amount_total ?? 0) / 100,
      },
    })

    return NextResponse.json({ paid: true, paidUntil })
  }

  return NextResponse.json({ paid: false })
}
