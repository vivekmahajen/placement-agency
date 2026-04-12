import type { Provider } from '@/lib/types'

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function buildLinkedInUrl(p: Provider): string {
  const parts = [p.firstName, p.lastName, p.professionLabel, p.organizationName, p.city, p.state]
    .filter(Boolean)
    .join(' ')
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(parts)}`
}

export async function POST(request: Request) {
  let providers: Provider[]

  try {
    const body = await request.json()
    providers = body.providers
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const headers = [
    'Name',
    'Credential',
    'Profession',
    'Organization',
    'Phone',
    'Address',
    'City',
    'State',
    'Zip',
    'Email',
    'NPI Number',
    'LinkedIn Search',
  ]

  const rows = providers.map((p: Provider) => [
    `${p.lastName}${p.firstName ? ', ' + p.firstName : ''}`,
    p.credential,
    p.professionLabel,
    p.organizationName,
    p.phone,
    p.address,
    p.city,
    p.state,
    p.zip,
    p.email ?? 'N/A',
    p.npi,
    buildLinkedInUrl(p),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell ?? ''))).join(','))
    .join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="healthcare-providers.csv"',
    },
  })
}
