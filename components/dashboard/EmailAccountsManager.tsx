'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type EmailAccount = {
  id: string
  emailAddress: string
  isConnected: boolean
  lastScannedAt: string | null
  createdAt: string
}

export default function EmailAccountsManager({
  initial,
  errorParam,
  connectedParam,
}: {
  initial: EmailAccount[]
  errorParam?: string
  connectedParam?: string
}) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<EmailAccount[]>(initial)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(
    errorParam === 'gmail_denied' ? 'Gmail access was denied. Please try again.' : ''
  )
  const [success, setSuccess] = useState(connectedParam === 'true' ? 'Gmail connected successfully!' : '')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setAdding(true)
    const res = await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAddress: newEmail }),
    })
    const data = await res.json()
    setAdding(false)
    if (!res.ok) { setError(data.error); return }
    setAccounts(a => [data.account, ...a])
    setNewEmail('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this email account and all its scan history?')) return
    const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAccounts(a => a.filter(acc => acc.id !== id))
      router.refresh()
    }
  }

  async function handleScan(id: string) {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAccountId: id }),
    })
    const data = await res.json()
    if (res.ok) setSuccess(`Scan complete: ${data.newMatches} new urgent email(s) found`)
    else setError(data.error)
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 border border-green-200">{success}</div>}

      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="email"
          required
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="gmail-to-monitor@gmail.com"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={adding}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
          {adding ? 'Adding…' : '+ Add Email'}
        </button>
      </form>

      {accounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No email accounts yet</p>
          <p className="text-sm mt-1">Add a Gmail address above to start monitoring</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Email Address</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Gmail Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Last Scanned</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">{acc.emailAddress}</td>
                  <td className="px-5 py-4">
                    {acc.isConnected ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium border border-green-200">
                        ✓ Connected
                      </span>
                    ) : (
                      <a href={`/api/gmail/connect?emailAccountId=${acc.id}`}
                        className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 hover:bg-blue-100">
                        Connect Gmail →
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {acc.lastScannedAt ? new Date(acc.lastScannedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-5 py-4 flex gap-2 justify-end">
                    {acc.isConnected && (
                      <button onClick={() => handleScan(acc.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50">
                        Scan Now
                      </button>
                    )}
                    <button onClick={() => handleDelete(acc.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm text-gray-600">
        <strong>Pricing reminder:</strong> Each connected email account is billed at <strong>$4.99/month</strong>.
        You currently have <strong>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</strong> —
        that&apos;s ${(accounts.length * 4.99 * 12).toFixed(2)} for the 12-month term.
      </div>
    </div>
  )
}
