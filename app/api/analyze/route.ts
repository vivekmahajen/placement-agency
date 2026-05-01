import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'
import { saveRecord } from '@/lib/storage'
import type { AnalyzeRequest, CaseRecord } from '@/lib/types'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are an expert care placement specialist with deep knowledge of US healthcare systems, discharge planning, case management, and social work. You help discharge planners, case managers, and social workers solve their most challenging pain points when placing patients in care homes and long-term care facilities.

When given a pain point or challenge:
1. Thoroughly analyze the specific challenge in context
2. Use web search to find current best practices, resources, regulations, and real-world solutions
3. Provide concrete, actionable recommendations a busy healthcare professional can implement today
4. Include relevant tools, organizations, regulatory frameworks, and funding sources
5. Suggest both immediate quick wins and longer-term strategies
6. Cite specific resources, hotlines, platforms, or advocacy groups where applicable

Be practical, empathetic, and specific. These professionals are stretched thin — give them exactly what they need.`

export async function POST(request: Request) {
  let body: AnalyzeRequest

  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { title, name, facility, location, capacity, painPoint } = body

  if (!title || !name || !painPoint) {
    return new Response(JSON.stringify({ error: 'title, name, and painPoint are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userMessage = `I am a ${title} at ${facility || 'a healthcare facility'}${location ? ` in ${location}` : ''}.${capacity ? ` Our facility has a capacity of ${capacity} beds/patients.` : ''}

My challenge:
${painPoint}

Please search for and provide the best possible solutions, resources, and strategies to address this challenge. Be specific and actionable.`

  const encoder = new TextEncoder()
  let fullSolution = ''

  const readableStream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      try {
        let messages: Anthropic.MessageParam[] = [
          { role: 'user', content: userMessage },
        ]

        while (true) {
          const stream = client.messages.stream({
            model: 'claude-opus-4-7',
            max_tokens: 8000,
            thinking: { type: 'adaptive' },
            system: SYSTEM_PROMPT,
            tools: [
              { type: 'web_search_20260209', name: 'web_search' },
            ],
            messages,
          })

          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              fullSolution += event.delta.text
              send({ type: 'delta', text: event.delta.text })
            }
          }

          const finalMsg = await stream.finalMessage()

          if (finalMsg.stop_reason !== 'pause_turn') break

          messages = [
            { role: 'user', content: userMessage },
            { role: 'assistant', content: finalMsg.content },
          ]
        }

        const record: CaseRecord = {
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          title,
          name,
          facility: facility || '',
          location: location || '',
          capacity: capacity || '',
          painPoint,
          solution: fullSolution,
        }

        saveRecord(record)
        send({ type: 'done', record })
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred'
        send({ type: 'error', message })
        controller.close()
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
