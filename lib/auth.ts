import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import type { AuthPayload } from './types'

export const COOKIE_NAME = 'auth-token'

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'dev-secret-please-set-JWT_SECRET-in-production'
  )
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as AuthPayload
  } catch {
    return null
  }
}
