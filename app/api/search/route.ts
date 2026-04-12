import { NextResponse } from 'next/server'
import type { SearchQuery, SearchResult } from '@/lib/types'
import { fetchNpiPage } from '@/lib/npi'
import { enhanceWithPlaces } from '@/lib/places'
import { NPI_MAX_SKIP, PLACES_ENHANCE_LIMIT } from '@/lib/constants'

export async function POST(request: Request) {
  let body: SearchQuery

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { city, state, zip, profession, page } = body

  if (!zip && !(city && state)) {
    return NextResponse.json(
      { error: 'Provide a zip code or both city and state.' },
      { status: 400 }
    )
  }

  if (!['social_worker', 'case_manager', 'all'].includes(profession)) {
    return NextResponse.json({ error: 'Invalid profession.' }, { status: 400 })
  }

  const currentPage = Math.max(1, page ?? 1)
  const skip = (currentPage - 1) * 200

  if (skip >= NPI_MAX_SKIP) {
    return NextResponse.json({
      providers: [],
      totalFetched: 0,
      hasMore: false,
      currentSkip: skip,
      warning:
        'Over 1,000 results exist for this search. Please narrow your search by using a zip code or a more specific city.',
    } satisfies SearchResult)
  }

  try {
    const { providers, hasMore } = await fetchNpiPage(
      { city, state, zip, profession },
      skip
    )

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const toEnhance = providers.slice(0, PLACES_ENHANCE_LIMIT)
    const rest = providers.slice(PLACES_ENHANCE_LIMIT)
    const enhanced = await enhanceWithPlaces(toEnhance, apiKey)
    const final = [...enhanced, ...rest]

    return NextResponse.json({
      providers: final,
      totalFetched: final.length,
      hasMore,
      currentSkip: skip,
    } satisfies SearchResult)
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('NPI API')
        ? 'The NPI Registry is not responding. Please try again in a moment.'
        : 'An unexpected error occurred. Please try again.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
