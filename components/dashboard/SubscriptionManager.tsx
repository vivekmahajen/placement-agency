'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type SubInfo = {
  subscription: {
    id: string
    status: string
    trialEndDate: string
    paidUntil: string | null
    totalPaid: number | null
  } | null
  emailCount: number
  totalMonthly: number
  totalUpfront: number
}

export default function SubscriptionManager({ initial }: { initial: SubInfo }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [info, setInfo] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const sessionId = searchParams.get('session_id')
  const cancelled = searchParams.get('cancelled')

  useEffect(() => {
    if (cancelled) setMsg('Payment was cancelled. You can try again anytime.')
    if (sessionId) {
      fetch(`/api/subscription/checkout?session_id=${sessionId}`)
        .then(r => r.json())
        .then(d => {
          if (d.paid) {
            setMsg('Payment successful! Your subscription is now active.')
            router.refresh()
          }
        })
    }
  }, [sessionId, cancelled, router])

  async function handleCheckout() {
    setLoading(true)
    const res = await fetch('/api/subscription/checkout', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (data.url) window.location.href = data.url
    else setMsg(data.error ?? 'Checkout failed')
  }

  const sub = info.subscription
  const now = new Date()
  const isActive = sub?.status === 'ACTIVE' && sub.paidUntil && now <= new Date(sub.paidUntil)
  const trialEnd = sub?.trialEndDate ? new Date(sub.trialEndDate) : null
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)) : 0
  const isTrial = sub?.status === 'TRIAL' && now <= (trialEnd ?? now)

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${msg.includes('successful') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
          {msg}
        </div>
      )}

      {/* Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Current Status</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${isActive ? 'text-green-600' : isTrial ? 'text-blue-600' : 'text-red-600'}`}>
              {isActive ? 'Active' : isTrial ? `Trial (${daysLeft} days left)` : 'Expired'}
            </span>
          </div>
          {isTrial && trialEnd && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Trial ends</span>
              <span className="font-medium">{trialEnd.toLocaleDateString()}</span>
            </div>
          )}
          {isActive && sub?.paidUntil && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paid through</span>
              <span className="font-medium">{new Date(sub.paidUntil).toLocaleDateString()}</span>
            </div>
          )}
          {sub?.totalPaid && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total paid</span>
              <span className="font-medium">${sub.totalPaid.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Pricing Breakdown</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Registered email accounts</span>
            <span className="font-medium">{info.emailCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Rate per email</span>
            <span className="font-medium">$4.99 / month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Monthly cost</span>
            <span className="font-medium">${info.totalMonthly.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Minimum term</span>
            <span className="font-medium">12 months</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
            <span>Total due today</span>
            <span className="text-blue-700">${info.totalUpfront.toFixed(2)}</span>
          </div>
          <p className="text-gray-400 text-xs">
            {info.emailCount} email(s) × $4.99 × 12 months. No recurring charges — one upfront payment.
          </p>
        </div>
      </div>

      {!isActive && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h2 className="font-bold text-xl mb-1">Subscribe Now</h2>
          <p className="text-blue-100 text-sm mb-4">
            Pay for 12 months upfront and never worry about missing another urgent email.
          </p>
          {info.emailCount === 0 ? (
            <p className="text-yellow-200 text-sm">Add at least one email account before subscribing.</p>
          ) : (
            <button onClick={handleCheckout} disabled={loading}
              className="bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors">
              {loading ? 'Redirecting…' : `Pay $${info.totalUpfront.toFixed(2)} – Activate 12 Months`}
            </button>
          )}
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-1">
        <p>• Payments are processed securely by Stripe</p>
        <p>• By subscribing you agree to the 12-month minimum service agreement</p>
        <p>• Service includes unlimited keyword monitoring for registered email accounts</p>
      </div>
    </div>
  )
}
