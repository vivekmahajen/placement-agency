import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  return NextResponse.json({
    hasApiKey: Boolean(apiKey),
    apiKeyPrefix: apiKey ? apiKey.slice(0, 14) + '...' : '(not set)',
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    nodeEnv: process.env.NODE_ENV,
  })
}
