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
