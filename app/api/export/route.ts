import type { Provider } from '@/lib/types'

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
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
