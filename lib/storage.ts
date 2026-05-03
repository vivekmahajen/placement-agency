import type { CaseRecord, User } from './types'
import { Pool } from 'pg'

// ── Postgres ───────────────────────────────────────────────────────────────
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    })
  }
  return pool
}

async function ensureTables(): Promise<void> {
  const client = await getPool().connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_records (
        id          TEXT PRIMARY KEY,
        created_at  TIMESTAMPTZ NOT NULL,
        title       TEXT NOT NULL,
        name        TEXT NOT NULL,
        facility    TEXT NOT NULL DEFAULT '',
        location    TEXT NOT NULL DEFAULT '',
        capacity    TEXT NOT NULL DEFAULT '',
        pain_point  TEXT NOT NULL,
        solution    TEXT NOT NULL
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT UNIQUE NOT NULL,
        name          TEXT NOT NULL,
        title         TEXT NOT NULL DEFAULT 'Social Worker',
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  } finally {
    client.release()
  }
}

async function getRecordsFromDb(): Promise<CaseRecord[]> {
  await ensureTables()
  const { rows } = await getPool().query(
    'SELECT id, created_at, title, name, facility, location, capacity, pain_point, solution FROM case_records ORDER BY created_at DESC'
  )
  return rows.map((r) => ({
    id: r.id, createdAt: r.created_at, title: r.title, name: r.name,
    facility: r.facility, location: r.location, capacity: r.capacity,
    painPoint: r.pain_point, solution: r.solution,
  }))
}

async function saveRecordToDb(record: CaseRecord): Promise<void> {
  await ensureTables()
  await getPool().query(
    `INSERT INTO case_records (id, created_at, title, name, facility, location, capacity, pain_point, solution)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
    [record.id, record.createdAt, record.title, record.name,
     record.facility, record.location, record.capacity, record.painPoint, record.solution]
  )
}

async function findUserByEmailDb(email: string): Promise<(User & { passwordHash: string }) | null> {
  await ensureTables()
  const { rows } = await getPool().query(
    'SELECT id, email, name, title, password_hash, created_at FROM users WHERE email = $1 LIMIT 1',
    [email]
  )
  if (!rows[0]) return null
  const r = rows[0]
  return { id: r.id, email: r.email, name: r.name, title: r.title,
           passwordHash: r.password_hash, createdAt: r.created_at }
}

async function createUserDb(user: User & { passwordHash: string }): Promise<void> {
  await ensureTables()
  await getPool().query(
    `INSERT INTO users (id, email, name, title, password_hash, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [user.id, user.email, user.name, user.title, user.passwordHash, user.createdAt]
  )
}

// ── File fallback (local dev / Vercel without Postgres) ───────────────────
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/placement-data'
  : path.join(process.cwd(), 'data')
const RECORDS_FILE = path.join(DATA_DIR, 'records.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

function ensureDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch { /* ignore */ }
}

function readJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) as T } catch { return fallback }
}

function writeJson(file: string, data: unknown) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8') } catch { /* ignore */ }
}

function getRecordsFromFile(): CaseRecord[] {
  ensureDir(); return readJson<CaseRecord[]>(RECORDS_FILE, [])
}

function saveRecordToFile(record: CaseRecord) {
  ensureDir()
  const records = getRecordsFromFile()
  records.unshift(record)
  writeJson(RECORDS_FILE, records)
}

type UserWithHash = User & { passwordHash: string }

function findUserByEmailFile(email: string): UserWithHash | null {
  ensureDir()
  const users = readJson<UserWithHash[]>(USERS_FILE, [])
  return users.find((u) => u.email === email) ?? null
}

function createUserFile(user: UserWithHash) {
  ensureDir()
  const users = readJson<UserWithHash[]>(USERS_FILE, [])
  users.push(user)
  writeJson(USERS_FILE, users)
}

// ── Public API (Postgres with automatic file fallback) ────────────────────
export async function getRecords(): Promise<CaseRecord[]> {
  if (process.env.POSTGRES_URL) {
    try { return await getRecordsFromDb() } catch { /* fall through */ }
  }
  return getRecordsFromFile()
}

export async function saveRecord(record: CaseRecord): Promise<void> {
  if (process.env.POSTGRES_URL) {
    try { await saveRecordToDb(record); return } catch { /* fall through */ }
  }
  saveRecordToFile(record)
}

export async function findUserByEmail(email: string): Promise<UserWithHash | null> {
  if (process.env.POSTGRES_URL) {
    try { return await findUserByEmailDb(email) } catch { /* fall through */ }
  }
  return findUserByEmailFile(email)
}

export async function createUser(user: UserWithHash): Promise<void> {
  if (process.env.POSTGRES_URL) {
    try { await createUserDb(user); return } catch { /* fall through */ }
  }
  createUserFile(user)
}
