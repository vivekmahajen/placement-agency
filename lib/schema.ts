import type { Database } from 'better-sqlite3'

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS care_homes (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT NOT NULL,
      address          TEXT,
      city             TEXT,
      state            TEXT DEFAULT 'CA',
      zip              TEXT,
      phone            TEXT,
      email            TEXT,
      website          TEXT,
      source           TEXT DEFAULT 'csv',
      email_status     TEXT DEFAULT 'pending',
      email_valid      INTEGER DEFAULT 1,
      last_emailed_at  TEXT,
      created_at       TEXT DEFAULT (datetime('now')),
      updated_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      care_home_id          INTEGER REFERENCES care_homes(id),
      sent_at               TEXT DEFAULT (datetime('now')),
      sendgrid_message_id   TEXT,
      subject               TEXT,
      status                TEXT DEFAULT 'sent',
      reply_received_at     TEXT,
      raw_reply             TEXT
    );

    CREATE TABLE IF NOT EXISTS availability_reports (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      care_home_id     INTEGER REFERENCES care_homes(id),
      email_log_id     INTEGER REFERENCES email_log(id),
      reported_at      TEXT DEFAULT (datetime('now')),
      total_open_beds  INTEGER,
      raw_reply        TEXT,
      parsed_by        TEXT DEFAULT 'claude'
    );

    CREATE TABLE IF NOT EXISTS beds (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      availability_report_id   INTEGER REFERENCES availability_reports(id),
      care_home_id             INTEGER REFERENCES care_homes(id),
      room_type                TEXT,
      base_cost                REAL,
      gender_accommodation     TEXT,
      notes                    TEXT,
      created_at               TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_care_homes_email_status ON care_homes(email_status);
    CREATE INDEX IF NOT EXISTS idx_care_homes_email ON care_homes(email);
    CREATE INDEX IF NOT EXISTS idx_availability_reports_care_home ON availability_reports(care_home_id);
    CREATE INDEX IF NOT EXISTS idx_beds_care_home ON beds(care_home_id);
    CREATE INDEX IF NOT EXISTS idx_email_log_care_home ON email_log(care_home_id);
  `)
}
