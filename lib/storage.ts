import fs from 'fs'
import path from 'path'
import type { CaseRecord } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
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
  ensureDataFile()
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as CaseRecord[]
  } catch {
    return []
  }
}

export function saveRecord(record: CaseRecord): void {
  ensureDataFile()
  const records = getRecords()
  records.unshift(record)
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8')
}
