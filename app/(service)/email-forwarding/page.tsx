import Link from 'next/link'

export const metadata = {
  title: 'UrgentMail – Urgent Email Forwarding Service',
  description: 'Never miss an urgent email. Get daily SMS alerts for keywords like URGENT, billing, medical alert, and more.',
}

const FEATURES = [
  {
    icon: '🔍',
    title: 'Smart Keyword Scanning',
    desc: 'Set keywords like URGENT, billing, medical alert, or any phrase. The agent scans all your registered Gmail accounts daily.',
  },
  {
    icon: '📱',
    title: 'Daily SMS Summary at 6 AM PST',
    desc: 'Wake up every morning with a clear text summary of all urgent emails found the previous day — right on your phone.',
  },
  {
    icon: '📬',
    title: 'Multiple Email Accounts',
    desc: 'Monitor multiple Gmail accounts from one dashboard. Each account is scanned independently with the same keyword set.',
  },
  {
    icon: '📊',
    title: 'Full History & Reports',
    desc: 'Track every urgent email that was detected. Admins can view monthly reports per customer showing all activity.',
  },
  {
    icon: '🔒',
    title: 'Secure Gmail OAuth',
    desc: 'We never store your password. Access is granted through Google\'s secure OAuth2 with read-only email permissions.',
  },
  {
    icon: '⚙️',
    title: 'Self-Managed Keywords',
    desc: 'Add, remove, and adjust keywords any time. Changes take effect at the next daily scan.',
  },
]

const KEYWORDS_EXAMPLE = [
  'URGENT', 'Extremely Urgent', 'ASAP', 'billing',
  'medical alert', 'lab results', 'bill alert',
  'account suspended', 'payment overdue', 'security alert',
]

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-6">📧</div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Never Miss an<br />Urgent Email Again
          </h1>
          <p className="mt-5 text-lg text-blue-100 max-w-2xl mx-auto">
            UrgentMail scans your Gmail inbox for critical keywords and delivers a daily SMS summary
            at 6:00 AM PST — so you always know what needs your immediate attention.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              Start 30-Day Free Trial
            </Link>
            <Link href="/auth/login"
              className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Sign In
            </Link>
          </div>
          <p className="mt-4 text-blue-200 text-sm">No credit card required for trial</p>
        </div>
      </section>

      {/* Keyword Examples */}
      <section className="py-12 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Scan for any keyword you choose
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {KEYWORDS_EXAMPLE.map(kw => (
              <span key={kw}
                className="bg-orange-50 text-orange-800 border border-orange-200 px-3 py-1.5 rounded-full text-sm font-medium">
                {kw}
              </span>
            ))}
            <span className="text-gray-400 px-3 py-1.5 text-sm">+ any custom keyword…</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-gray-50" id="pricing">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-600 mb-10">
            Start free. Pay for 12 months upfront after your trial ends.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-7 shadow-sm">
              <div className="text-blue-600 font-bold text-sm uppercase tracking-wide mb-2">Free Trial</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
              <div className="text-gray-500 text-sm mb-5">for 30 days</div>
              <ul className="space-y-3 text-sm text-gray-700">
                {[
                  'Full access to all features',
                  'Connect unlimited Gmail accounts',
                  'Daily 6 AM PST SMS summaries',
                  'Custom keyword scanning',
                  'No credit card required',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register"
                className="mt-6 block text-center bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Paid Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl border-2 border-blue-500 p-7 shadow-lg text-white">
              <div className="text-blue-200 font-bold text-sm uppercase tracking-wide mb-2">Paid Plan</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="text-blue-200 text-sm mb-1">/email/month</span>
              </div>
              <div className="text-blue-200 text-sm mb-5">billed as 12-month lump sum</div>
              <ul className="space-y-3 text-sm text-blue-50">
                {[
                  'Everything in free trial',
                  '12-month minimum agreement',
                  'Full 12-month fee charged upfront',
                  'Per email account registered',
                  'Secure payment via Stripe',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-yellow-300 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 bg-white/10 rounded-lg px-4 py-3 text-sm">
                <p className="text-blue-100">Example: 2 emails × $4.99 × 12 months</p>
                <p className="font-bold text-white text-lg">= $119.76 total</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-2xl mx-auto text-sm text-yellow-800">
            <strong>Service Agreement:</strong> By subscribing after the free trial, you agree to a minimum
            12-month service term. The full 12-month fee is charged upfront and is non-refundable.
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 px-4 text-center bg-blue-600 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to stay on top of your inbox?</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
          Join UrgentMail today and start your 30-day free trial. Setup takes less than 5 minutes.
        </p>
        <Link href="/auth/register"
          className="inline-block bg-white text-blue-700 font-bold px-10 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-lg">
          Get Started — It&apos;s Free
        </Link>
      </section>
    </div>
  )
}
