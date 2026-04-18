import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = { title: 'Create Account – UrgentMail' }

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Start your free trial</h1>
          <p className="mt-2 text-gray-600">30 days free — no credit card required</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
