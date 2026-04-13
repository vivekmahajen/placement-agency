export interface Provider {
  npi: string
  firstName: string
  lastName: string
  credential: string
  professionLabel: string
  taxonomyCode: string
  organizationName: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  email: null
  source: 'npi' | 'npi+places'
}

export interface SearchQuery {
  city?: string
  state?: string
  zip?: string
  profession: 'social_worker' | 'case_manager' | 'all'
  page: number
}

export interface SearchResult {
  providers: Provider[]
  totalFetched: number
  hasMore: boolean
  currentSkip: number
  warning?: string
}

export interface NpiAddress {
  address_purpose: 'MAILING' | 'LOCATION'
  address_1: string
  address_2?: string
  city: string
  state: string
  postal_code: string
  telephone_number?: string
}

export interface NpiTaxonomy {
  code: string
  desc: string
  primary: boolean
  state?: string
  license?: string
}

// ─── Care Home Agent Types ─────────────────────────────────────────────────────

export interface CareHome {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string
  zip: string | null
  phone: string | null
  email: string | null
  website: string | null
  source: 'csv' | 'manual' | 'places'
  email_status: 'pending' | 'sent' | 'replied' | 'opted_out'
  email_valid: number  // 1 = valid, 0 = invalid
  last_emailed_at: string | null
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: number
  care_home_id: number
  sent_at: string
  sendgrid_message_id: string | null
  subject: string | null
  status: 'sent' | 'delivered' | 'bounced' | 'failed' | 'replied'
  reply_received_at: string | null
  raw_reply: string | null
}

export interface AvailabilityReport {
  id: number
  care_home_id: number
  email_log_id: number | null
  reported_at: string
  total_open_beds: number | null
  raw_reply: string
  parsed_by: string
}

export interface Bed {
  id: number
  availability_report_id: number
  care_home_id: number
  room_type: 'private' | 'shared' | null
  base_cost: number | null
  gender_accommodation: 'male' | 'female' | 'both' | null
  notes: string | null
  created_at: string
}

export interface BedWithHome extends Bed {
  home_name: string
  home_city: string | null
  home_phone: string | null
  home_email: string | null
  home_address: string | null
  home_zip: string | null
  reported_at: string
}

export interface ParsedAvailability {
  total_open_beds: number | null
  beds: {
    room_type: 'private' | 'shared' | null
    base_cost: number | null
    gender_accommodation: 'male' | 'female' | 'both' | null
    notes: string | null
  }[]
  facility_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  no_availability: boolean
  opted_out: boolean
  confidence: 'high' | 'medium' | 'low'
}

export interface AgentRunResult {
  attempted: number
  sent: number
  failed: number
  skipped: number
  errors: { homeId: number; homeName: string; error: string }[]
  timestamp: string
}

// ─── NPI Registry Types ────────────────────────────────────────────────────────

export interface NpiRawResult {
  number: string
  enumeration_type: 'NPI-1' | 'NPI-2'
  basic: {
    first_name?: string
    last_name?: string
    middle_name?: string
    name_prefix?: string
    credential?: string
    organization_name?: string
    authorized_official_first_name?: string
    authorized_official_last_name?: string
    authorized_official_telephone_number?: string
    status: string
  }
  addresses: NpiAddress[]
  taxonomies: NpiTaxonomy[]
}
