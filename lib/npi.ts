import type { Provider, NpiRawResult, SearchQuery } from './types'
import {
  TAXONOMY_CODES,
  TAXONOMY_SEARCH_TERMS,
  PROFESSION_LABELS,
  NPI_MAX_RESULTS_PER_PAGE,
} from './constants'

const NPI_API_BASE = 'https://npiregistry.cms.hhs.gov/api/?version=2.1'

function formatPhone(raw: string | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return raw
}

function buildNpiUrl(params: {
  city?: string
  state?: string
  zip?: string
  taxonomyTerm: string
  skip: number
}): string {
  const p = new URLSearchParams({
    enumeration_type: 'NPI-1',
    taxonomy_description: params.taxonomyTerm,
    limit: String(NPI_MAX_RESULTS_PER_PAGE),
    skip: String(params.skip),
  })
  if (params.zip) {
    p.set('postal_code', params.zip.slice(0, 5))
  } else {
    if (params.city) p.set('city', params.city)
    if (params.state) p.set('state', params.state)
  }
  return `${NPI_API_BASE}&${p.toString()}`
}

function normalizeNpiRecord(raw: NpiRawResult): Provider | null {
  if (raw.basic.status !== 'A') return null

  const matchedTaxonomy = raw.taxonomies.find((t) =>
    (TAXONOMY_CODES.ALL as readonly string[]).includes(t.code)
  )
  if (!matchedTaxonomy) return null

  const addr =
    raw.addresses.find((a) => a.address_purpose === 'LOCATION') ??
    raw.addresses[0]

  const phone =
    addr?.telephone_number ??
    raw.basic.authorized_official_telephone_number ??
    ''

  const zip = addr?.postal_code?.slice(0, 5) ?? ''
  const addressStr = addr
    ? [addr.address_1, addr.address_2, addr.city, addr.state, zip]
        .filter(Boolean)
        .join(', ')
    : ''

  return {
    npi: raw.number,
    firstName: raw.basic.first_name ?? '',
    lastName: raw.basic.last_name ?? '',
    credential: raw.basic.credential ?? '',
    professionLabel:
      PROFESSION_LABELS[matchedTaxonomy.code] ?? matchedTaxonomy.desc,
    taxonomyCode: matchedTaxonomy.code,
    organizationName: '',
    phone: formatPhone(phone),
    address: addressStr,
    city: addr?.city ?? '',
    state: addr?.state ?? '',
    zip,
    email: null,
    source: 'npi',
  }
}

export async function fetchNpiPage(
  query: Pick<SearchQuery, 'city' | 'state' | 'zip' | 'profession'>,
  skip: number
): Promise<{ providers: Provider[]; hasMore: boolean }> {
  const taxonomyTerms = TAXONOMY_SEARCH_TERMS[query.profession]

  const fetches = taxonomyTerms.map((term) => {
    const url = buildNpiUrl({
      city: query.city,
      state: query.state,
      zip: query.zip,
      taxonomyTerm: term,
      skip,
    })
    return fetch(url, { signal: AbortSignal.timeout(15000) }).then((r) => {
      if (!r.ok) throw new Error(`NPI API returned ${r.status}`)
      return r.json() as Promise<{ results?: NpiRawResult[]; result_count?: number }>
    })
  })

  const responses = await Promise.all(fetches)
  const allRaw: NpiRawResult[] = responses.flatMap((r) => r.results ?? [])

  const seen = new Set<string>()
  const unique = allRaw.filter((r) => {
    if (seen.has(r.number)) return false
    seen.add(r.number)
    return true
  })

  const providers = unique
    .map(normalizeNpiRecord)
    .filter((p): p is Provider => p !== null)

  const hasMore = responses.some(
    (r) => (r.results?.length ?? 0) >= NPI_MAX_RESULTS_PER_PAGE
  )

  return { providers, hasMore }
}
