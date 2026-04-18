import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import LogoutButton from './LogoutButton'

export default async function Navbar() {
  const session = await getCurrentUser()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/email-forwarding" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">📧</span>
            <span className="text-lg font-bold text-gray-900">UrgentMail</span>
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/emails"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Emails
                </Link>
                <Link
                  href="/dashboard/keywords"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Keywords
                </Link>
                {session.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

