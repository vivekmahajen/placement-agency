import Anthropic from '@anthropic-ai/sdk'
import type { ParsedAvailability } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a data extraction assistant. Parse email replies from California care home facilities and extract structured bed availability data.

Always respond with valid JSON matching this exact schema:
{
  "total_open_beds": number | null,
  "beds": [
    {
      "room_type": "private" | "shared" | null,
      "base_cost": number | null,
      "gender_accommodation": "male" | "female" | "both" | null,
      "notes": string | null
    }
  ],
  "facility_name": string | null,
  "address": string | null,
  "phone": string | null,
  "email": string | null,
  "no_availability": boolean,
  "opted_out": boolean,
  "confidence": "high" | "medium" | "low"
}

Rules:
- If the facility says they have no beds available, set total_open_beds to 0 and no_availability to true.
- If the facility asks to be removed ("unsubscribe", "remove me", "stop emailing"), set opted_out to true.
- base_cost must be a plain monthly dollar number (e.g. 3500, not "$3,500/month").
- Create one bed entry per bed type described. If multiple identical beds, create one entry with notes describing count.
- gender_accommodation: "male" = male only, "female" = female only, "both" = either gender.
- confidence: "high" if all fields clearly stated, "medium" if some inference needed, "low" if ambiguous.
- Respond ONLY with the JSON object. No explanation, no markdown code fences.`

export async function parseReplyWithClaude(rawEmailBody: string): Promise<ParsedAvailability> {
  const fallback: ParsedAvailability = {
    total_open_beds: null,
    beds: [],
    facility_name: null,
    address: null,
    phone: null,
    email: null,
    no_availability: false,
    opted_out: false,
    confidence: 'low',
  }

  if (!process.env.ANTHROPIC_API_KEY) return fallback

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse the following care home email reply and extract bed availability information:\n\n${rawEmailBody.slice(0, 4000)}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text) as ParsedAvailability
  } catch {
    return fallback
  }
}
