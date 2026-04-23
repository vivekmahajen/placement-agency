import getDb from './db'
import type { CareHome, EmailLog, AvailabilityReport, Bed, BedWithHome } from './types'

// ─── Care Homes ───────────────────────────────────────────────────────────────

export function getCareHomes(opts: {
  city?: string
  emailStatus?: string
  page?: number
  pageSize?: number
} = {}): { homes: CareHome[]; total: number } {
  const db = getDb()
  const { city, emailStatus, page = 1, pageSize = 50 } = opts
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: unknown[] = []

  if (city) { conditions.push("LOWER(city) LIKE ?"); params.push(`%${city.toLowerCase()}%`) }
  if (emailStatus) { conditions.push("email_status = ?"); params.push(emailStatus) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = (db.prepare(`SELECT COUNT(*) as n FROM care_homes ${where}`).get(...params) as { n: number }).n
  const homes = db.prepare(`SELECT * FROM care_homes ${where} ORDER BY name ASC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as CareHome[]

  return { homes, total }
}

export function getCareHomeById(id: number): CareHome | undefined {
  return getDb().prepare('SELECT * FROM care_homes WHERE id = ?').get(id) as CareHome | undefined
}

export function upsertCareHome(data: Omit<CareHome, 'id' | 'created_at' | 'updated_at'>): number {
  const db = getDb()

  // Try to find existing by email (if provided) or name+city
  let existing: CareHome | undefined
  if (data.email) {
    existing = db.prepare('SELECT * FROM care_homes WHERE email = ?').get(data.email) as CareHome | undefined
  }
  if (!existing && data.name) {
    existing = db.prepare('SELECT * FROM care_homes WHERE LOWER(name) = LOWER(?) AND LOWER(city) = LOWER(?)').get(data.name, data.city ?? '') as CareHome | undefined
  }

  if (existing) {
    db.prepare(`
      UPDATE care_homes SET
        name = ?, address = ?, city = ?, state = ?, zip = ?,
        phone = ?, email = COALESCE(?, email), website = ?,
        source = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.name, data.address, data.city, data.state, data.zip, data.phone, data.email, data.website, data.source, existing.id)
    return existing.id
  }

  const result = db.prepare(`
    INSERT INTO care_homes (name, address, city, state, zip, phone, email, website, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.name, data.address, data.city, data.state, data.zip, data.phone, data.email, data.website, data.source)

  return result.lastInsertRowid as number
}

export function updateCareHomeEmailStatus(id: number, status: string, lastEmailedAt?: string): void {
  getDb().prepare(`
    UPDATE care_homes SET email_status = ?, last_emailed_at = COALESCE(?, last_emailed_at), updated_at = datetime('now') WHERE id = ?
  `).run(status, lastEmailedAt ?? null, id)
}

export function markEmailInvalid(id: number): void {
  getDb().prepare(`UPDATE care_homes SET email_valid = 0, updated_at = datetime('now') WHERE id = ?`).run(id)
}

export function getCareHomesToEmail(): CareHome[] {
  return getDb().prepare(`
    SELECT * FROM care_homes
    WHERE email IS NOT NULL
      AND email_valid = 1
      AND email_status != 'opted_out'
      AND (last_emailed_at IS NULL OR datetime(last_emailed_at) < datetime('now', '-7 days'))
    ORDER BY name ASC
  `).all() as CareHome[]
}

// ─── Email Log ────────────────────────────────────────────────────────────────

export function insertEmailLog(data: {
  care_home_id: number
  sendgrid_message_id?: string
  subject?: string
}): number {
  const result = getDb().prepare(`
    INSERT INTO email_log (care_home_id, sendgrid_message_id, subject)
    VALUES (?, ?, ?)
  `).run(data.care_home_id, data.sendgrid_message_id ?? null, data.subject ?? null)
  return result.lastInsertRowid as number
}

export function updateEmailLogReply(careHomeId: number, rawReply: string, repliedAt: string): number | null {
  // Find the most recent sent email log for this care home
  const log = getDb().prepare(`
    SELECT id FROM email_log WHERE care_home_id = ? ORDER BY sent_at DESC LIMIT 1
  `).get(careHomeId) as { id: number } | undefined

  if (!log) return null

  getDb().prepare(`
    UPDATE email_log SET reply_received_at = ?, raw_reply = ?, status = 'replied' WHERE id = ?
  `).run(repliedAt, rawReply, log.id)

  return log.id
}

export function getEmailLogs(opts: {
  careHomeId?: number
  page?: number
  pageSize?: number
} = {}): { logs: (EmailLog & { home_name: string })[]; total: number } {
  const db = getDb()
  const { careHomeId, page = 1, pageSize = 50 } = opts
  const offset = (page - 1) * pageSize

  const where = careHomeId ? 'WHERE el.care_home_id = ?' : ''
  const params: unknown[] = careHomeId ? [careHomeId] : []

  const total = (db.prepare(`SELECT COUNT(*) as n FROM email_log el ${where}`).get(...params) as { n: number }).n
  const logs = db.prepare(`
    SELECT el.*, ch.name as home_name FROM email_log el
    JOIN care_homes ch ON ch.id = el.care_home_id
    ${where} ORDER BY el.sent_at DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as (EmailLog & { home_name: string })[]

  return { logs, total }
}

// ─── Availability ─────────────────────────────────────────────────────────────

export function insertAvailabilityReport(data: {
  care_home_id: number
  email_log_id?: number
  total_open_beds?: number
  raw_reply: string
  parsed_by?: string
}): number {
  const result = getDb().prepare(`
    INSERT INTO availability_reports (care_home_id, email_log_id, total_open_beds, raw_reply, parsed_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.care_home_id, data.email_log_id ?? null, data.total_open_beds ?? null, data.raw_reply, data.parsed_by ?? 'claude')
  return result.lastInsertRowid as number
}

export function insertBed(data: {
  availability_report_id: number
  care_home_id: number
  room_type?: string | null
  base_cost?: number | null
  gender_accommodation?: string | null
  notes?: string | null
}): number {
  const result = getDb().prepare(`
    INSERT INTO beds (availability_report_id, care_home_id, room_type, base_cost, gender_accommodation, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.availability_report_id, data.care_home_id, data.room_type ?? null, data.base_cost ?? null, data.gender_accommodation ?? null, data.notes ?? null)
  return result.lastInsertRowid as number
}

export function getAvailability(opts: {
  city?: string
  roomType?: string
  gender?: string
  maxCost?: number
  page?: number
  pageSize?: number
} = {}): { beds: BedWithHome[]; total: number } {
  const db = getDb()
  const { city, roomType, gender, maxCost, page = 1, pageSize = 50 } = opts
  const offset = (page - 1) * pageSize

  const conditions: string[] = [
    // Only show beds from the most recent report per care home
    `ar.id = (SELECT id FROM availability_reports WHERE care_home_id = ch.id ORDER BY reported_at DESC LIMIT 1)`
  ]
  const params: unknown[] = []

  if (city) { conditions.push("LOWER(ch.city) LIKE ?"); params.push(`%${city.toLowerCase()}%`) }
  if (roomType) { conditions.push("b.room_type = ?"); params.push(roomType) }
  if (gender) { conditions.push("(b.gender_accommodation = ? OR b.gender_accommodation = 'both')"); params.push(gender) }
  if (maxCost) { conditions.push("b.base_cost <= ?"); params.push(maxCost) }

  const where = `WHERE ${conditions.join(' AND ')}`

  const baseQuery = `
    FROM beds b
    JOIN availability_reports ar ON ar.id = b.availability_report_id
    JOIN care_homes ch ON ch.id = b.care_home_id
    ${where}
  `

  const total = (db.prepare(`SELECT COUNT(*) as n ${baseQuery}`).get(...params) as { n: number }).n
  const beds = db.prepare(`
    SELECT b.*, ch.name as home_name, ch.city as home_city,
           ch.phone as home_phone, ch.email as home_email,
           ch.address as home_address, ch.zip as home_zip,
           ar.reported_at
    ${baseQuery}
    ORDER BY ar.reported_at DESC, ch.name ASC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as BedWithHome[]

  return { beds, total }
}
