import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { runMigrations } from './schema'

const DB_PATH = path.join(process.cwd(), 'data', 'care-homes.db')

declare global {
  // eslint-disable-next-line no-var
  var __db: InstanceType<typeof Database> | undefined
}

export function getDb(): InstanceType<typeof Database> {
  if (!globalThis.__db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    globalThis.__db = new Database(DB_PATH)
    globalThis.__db.pragma('journal_mode = WAL')
    globalThis.__db.pragma('foreign_keys = ON')
    runMigrations(globalThis.__db)
  }
  return globalThis.__db
}

export default getDb
