import type { Provider } from './types'

const PLACES_TEXT_SEARCH =
  'https://maps.googleapis.com/maps/api/place/textsearch/json'

async function lookupOrganization(
  provider: Provider,
  apiKey: string
): Promise<Provider> {
  if (provider.organizationName) return provider

  const query = `hospital OR clinic OR medical center near ${provider.address}`
  const params = new URLSearchParams({
    query,
    key: apiKey,
    type: 'hospital',
  })

  try {
    const res = await fetch(`${PLACES_TEXT_SEARCH}?${params}`, {
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    const place = data.results?.[0]
    if (place?.name) {
      return { ...provider, organizationName: place.name, source: 'npi+places' }
    }
  } catch {
    // Places enrichment is best-effort; silently skip on error
  }
  return provider
}

async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = []
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const current = index++
      results[current] = await tasks[current]()
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker)
  await Promise.all(workers)
  return results
}

export async function enhanceWithPlaces(
  providers: Provider[],
  apiKey: string | undefined
): Promise<Provider[]> {
  if (!apiKey || providers.length === 0) return providers

  const tasks = providers.map(
    (p) => () => lookupOrganization(p, apiKey)
  )
  return runWithConcurrencyLimit(tasks, 5)
}
