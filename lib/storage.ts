import type { CaseRecord } from './types'

// ── Postgres (Vercel) ──────────────────────────────────────────────────────
async function getDb() {
  const { sql } = await import('@vercel/postgres')
  return sql
}

async function ensureTable() {
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
}

async function getRecordsFromDb(): Promise<CaseRecord[]> {
  await ensureTable()
  const sql = await getDb()
  const { rows } = await sql`
    SELECT id, created_at, title, name, facility, location, capacity, pain_point, solution
    FROM case_records
    ORDER BY created_at DESC
  `
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    title: r.title,
    name: r.name,
    facility: r.facility,
    location: r.location,
    capacity: r.capacity,
    painPoint: r.pain_point,
    solution: r.solution,
  }))
}

async function saveRecordToDb(record: CaseRecord): Promise<void> {
  await ensureTable()
  const sql = await getDb()
  await sql`
    INSERT INTO case_records (id, created_at, title, name, facility, location, capacity, pain_point, solution)
    VALUES (
      ${record.id}, ${record.createdAt}, ${record.title}, ${record.name},
      ${record.facility}, ${record.location}, ${record.capacity},
      ${record.painPoint}, ${record.solution}
    )
    ON CONFLICT (id) DO NOTHING
  `
}

// ── File fallback (local dev) ──────────────────────────────────────────────
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'records.json')

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8')
}

function getRecordsFromFile(): CaseRecord[] {
  try {
    ensureDataFile()
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as CaseRecord[]
  } catch {
    return []
  }
}

function saveRecordToFile(record: CaseRecord): void {
  try {
    ensureDataFile()
    const records = getRecordsFromFile()
    records.unshift(record)
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8')
  } catch {
    // ignore
  }
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
