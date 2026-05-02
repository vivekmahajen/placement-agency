import type { CaseRecord, User } from './types'

// ── Postgres (Vercel) ──────────────────────────────────────────────────────
async function getDb() {
  const { sql } = await import('@vercel/postgres')
  return sql
}

async function ensureTables() {
  const sql = await getDb()
  await sql`
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
  `
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      title         TEXT NOT NULL DEFAULT 'Social Worker',
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

// ── Case Records (Postgres) ────────────────────────────────────────────────
async function getRecordsFromDb(): Promise<CaseRecord[]> {
  await ensureTables()
  const sql = await getDb()
  const { rows } = await sql`
    SELECT id, created_at, title, name, facility, location, capacity, pain_point, solution
    FROM case_records ORDER BY created_at DESC
  `
  return rows.map((r) => ({
    id: r.id, createdAt: r.created_at, title: r.title, name: r.name,
    facility: r.facility, location: r.location, capacity: r.capacity,
    painPoint: r.pain_point, solution: r.solution,
  }))
}

async function saveRecordToDb(record: CaseRecord): Promise<void> {
  await ensureTables()
  const sql = await getDb()
  await sql`
    INSERT INTO case_records (id, created_at, title, name, facility, location, capacity, pain_point, solution)
    VALUES (${record.id}, ${record.createdAt}, ${record.title}, ${record.name},
            ${record.facility}, ${record.location}, ${record.capacity},
            ${record.painPoint}, ${record.solution})
    ON CONFLICT (id) DO NOTHING
  `
}

// ── Users (Postgres) ───────────────────────────────────────────────────────
async function findUserByEmailDb(email: string): Promise<(User & { passwordHash: string }) | null> {
  await ensureTables()
  const sql = await getDb()
  const { rows } = await sql`
    SELECT id, email, name, title, password_hash, created_at
    FROM users WHERE email = ${email} LIMIT 1
  `
  if (!rows[0]) return null
  const r = rows[0]
  return { id: r.id, email: r.email, name: r.name, title: r.title,
           passwordHash: r.password_hash, createdAt: r.created_at }
}

async function createUserDb(user: User & { passwordHash: string }): Promise<void> {
  await ensureTables()
  const sql = await getDb()
  await sql`
    INSERT INTO users (id, email, name, title, password_hash, created_at)
    VALUES (${user.id}, ${user.email}, ${user.name}, ${user.title},
            ${user.passwordHash}, ${user.createdAt})
  `
}

// ── File fallback (local dev) ──────────────────────────────────────────────
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const RECORDS_FILE = path.join(DATA_DIR, 'records.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
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

// ── Public API ─────────────────────────────────────────────────────────────
const useDb = Boolean(process.env.POSTGRES_URL)

export async function getRecords(): Promise<CaseRecord[]> {
  if (useDb) return getRecordsFromDb()
  return getRecordsFromFile()
}

export async function saveRecord(record: CaseRecord): Promise<void> {
  if (useDb) return saveRecordToDb(record)
  saveRecordToFile(record)
}

export async function findUserByEmail(email: string): Promise<UserWithHash | null> {
  if (useDb) return findUserByEmailDb(email)
  return findUserByEmailFile(email)
}

export async function createUser(user: UserWithHash): Promise<void> {
  if (useDb) return createUserDb(user)
  createUserFile(user)
}
