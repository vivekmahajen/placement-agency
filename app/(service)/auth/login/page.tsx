import LoginForm from '@/components/auth/LoginForm'

export const metadata = { title: 'Sign In – UrgentMail' }

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">Sign in to your UrgentMail account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
