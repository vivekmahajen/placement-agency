import fs from 'fs'
import path from 'path'
import type { CaseRecord } from './types'

// On Vercel the project root is read-only; /tmp is writable but ephemeral.
// Locally, use the data/ directory so records persist across restarts.
const DATA_DIR = process.env.VERCEL
  ? '/tmp'
  : path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'records.json')

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8')
  }
}

export function getRecords(): CaseRecord[] {
  try {
    ensureDataFile()
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as CaseRecord[]
  } catch {
    return []
  }
}

export function saveRecord(record: CaseRecord): void {
  try {
    ensureDataFile()
    const records = getRecords()
    records.unshift(record)
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8')
  } catch {
    // Silently ignore write failures (e.g. read-only filesystem)
  }
}
