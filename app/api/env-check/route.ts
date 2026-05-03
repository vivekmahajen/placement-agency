import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  const postgresUrl = process.env.POSTGRES_URL ?? ''

  let dbStatus = 'not configured'
  if (postgresUrl) {
    try {
      const { Pool } = await import('pg')
      const pool = new Pool({ connectionString: postgresUrl, ssl: { rejectUnauthorized: false } })
      await pool.query('SELECT 1')
      await pool.end()
      dbStatus = 'connected ✓'
    } catch (e) {
      dbStatus = `failing: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  return NextResponse.json({
    anthropicApiKey: apiKey ? `set (${apiKey.slice(0, 14)}...)` : '❌ NOT SET',
    postgresUrl: postgresUrl ? `set (${postgresUrl.slice(0, 30)}...)` : '❌ NOT SET',
    databaseConnection: dbStatus,
    nodeEnv: process.env.NODE_ENV,
    jwtSecret: process.env.JWT_SECRET ? 'set' : 'using default (ok for dev)',
  })
}
