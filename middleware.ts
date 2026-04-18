import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'ef-auth'

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'urgentmail-jwt-secret-must-be-32chars-min!!'
  )
}

const PROTECTED_PREFIXES = ['/dashboard', '/admin']
const ADMIN_PREFIXES = ['/admin']
const AUTH_PREFIXES = ['/auth/login', '/auth/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAdminOnly = ADMIN_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage = AUTH_PREFIXES.some(p => pathname.startsWith(p))

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    try {
      const { payload } = await jwtVerify(token, getSecret())
      if (isAdminOnly && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      const res = NextResponse.redirect(new URL('/auth/login', request.url))
      res.cookies.delete(COOKIE_NAME)
      return res
    }
  }

  if (isAuthPage && token) {
    try {
      await jwtVerify(token, getSecret())
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch {
      // Invalid token — allow access to auth pages
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
}
