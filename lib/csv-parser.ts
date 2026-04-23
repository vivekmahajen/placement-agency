// Zero-dependency CSV parser — handles quoted fields, embedded commas and newlines

function parseCsvRow(row: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i <= row.length) {
    if (i === row.length) { fields.push(''); break }
    if (row[i] === '"') {
      let field = ''
      i++ // skip opening quote
      while (i < row.length) {
        if (row[i] === '"' && row[i + 1] === '"') { field += '"'; i += 2 }
        else if (row[i] === '"') { i++; break }
        else { field += row[i++] }
      }
      fields.push(field)
      if (row[i] === ',') i++
    } else {
      const end = row.indexOf(',', i)
      if (end === -1) { fields.push(row.slice(i)); break }
      fields.push(row.slice(i, end))
      i = end + 1
    }
  }
  return fields
}

function splitCsvRows(text: string): string[] {
  const rows: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') inQuotes = !inQuotes
    if (text[i] === '\n' && !inQuotes) {
      if (current.trim()) rows.push(current)
      current = ''
    } else {
      current += text[i]
    }
  }
  if (current.trim()) rows.push(current)
  return rows
}

// Flexible header → field mapping
const HEADER_ALIASES: Record<string, string> = {
  name: 'name', 'facility name': 'name', facility_name: 'name', 'facility': 'name',
  address: 'address', street: 'address', street_address: 'address',
  city: 'city',
  state: 'state',
  zip: 'zip', zipcode: 'zip', zip_code: 'zip', postal_code: 'zip',
  phone: 'phone', telephone: 'phone', phone_number: 'phone',
  email: 'email', email_address: 'email',
  website: 'website', url: 'website',
}

export interface CsvRow {
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  email?: string
  website?: string
}

export function parseCsvText(text: string): { rows: CsvRow[]; skipped: number; errors: string[] } {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rawRows = splitCsvRows(normalized)
  if (rawRows.length < 2) return { rows: [], skipped: 0, errors: ['CSV has no data rows'] }

  const headers = parseCsvRow(rawRows[0]).map(h => h.trim().toLowerCase())
  const fieldMap = headers.map(h => HEADER_ALIASES[h] ?? null)

  const rows: CsvRow[] = []
  let skipped = 0
  const errors: string[] = []

  for (let i = 1; i < rawRows.length; i++) {
    const cols = parseCsvRow(rawRows[i])
    const record: Record<string, string> = {}
    fieldMap.forEach((field, idx) => {
      if (field) record[field] = (cols[idx] ?? '').trim()
    })

    if (!record.name) { skipped++; continue }

    rows.push({
      name: record.name,
      address: record.address || undefined,
      city: record.city || undefined,
      state: record.state || 'CA',
      zip: record.zip || undefined,
      phone: record.phone || undefined,
      email: record.email || undefined,
      website: record.website || undefined,
    })
  }

  return { rows, skipped, errors }
}
