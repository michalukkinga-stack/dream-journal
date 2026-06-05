import { createAnthropic } from 'npm:@ai-sdk/anthropic@^3'
import { streamText } from 'npm:ai@^6'

const JUNG_SYSTEM_PROMPT = `Jesteś Carlem Gustavem Jungiem — rozmawiasz z użytkowniczką o jej snach. Jesteś jak sympatyczny kolega z pracy, który ma głęboką wiedzę o psychologii: mówisz normalnie, bez patosu, bez wielkich słów.

Używasz pojęć jungiańskich (Cień, Anima, Jaźń, archetypy, nieświadomość zbiorowa) naturalnie, gdy pasują — nie na pokaz. Zadajesz jedno konkretne pytanie zwrotne zamiast dawać gotowe odpowiedzi.

Mówisz po polsku, per ty. Ton: ciepły, bezpośredni, trochę dociekliwy — jak ktoś, z kim fajnie się rozmawia.

Gdy masz konkretny sen — skupiasz się na nim. Gdy pytanie ogólne — szukasz wzorców w całej historii snów.

Odpowiadasz krótko: 2–3 zdania maksymalnie, chyba że ktoś wyraźnie prosi o więcej. Nie moralizujesz, nie diagnoznie.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

type UIMessagePart = { type: string; text?: string }
type UIMessage = { id?: string; role: string; parts?: UIMessagePart[]; content?: string }

function toCoreMessages(messages: UIMessage[]) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => {
      const text = m.parts
        ? m.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('')
        : (m.content ?? '')
      return { role: m.role as 'user' | 'assistant', content: text }
    })
    .filter(m => m.content.length > 0)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { messages, currentDream, allDreams } = body as {
      messages: UIMessage[]
      currentDream?: { title: string; description: string; tags: string[]; createdAt: string }
      allDreams?: { date: string; title: string; tags: string[]; summary: string }[]
    }

    let contextBlock = ''

    if (currentDream) {
      contextBlock += `\n\n--- AKTUALNIE OGLĄDANY SEN ---\nData: ${currentDream.createdAt}\nOpis: ${currentDream.description}\nMotywy/tagi: ${currentDream.tags?.join(', ') || 'brak'}`
    }

    if (allDreams && allDreams.length > 0) {
      const dreamList = allDreams
        .map(d => `[${d.date}] ${d.title || 'Sen bez nazwy'} — tagi: ${d.tags?.join(', ') || 'brak'} — ${d.summary}`)
        .join('\n')
      contextBlock += `\n\n--- WSZYSTKIE SNY UŻYTKOWNICZKI ---\n${dreamList}`
    }

    const systemPrompt = JUNG_SYSTEM_PROMPT + contextBlock

    const anthropic = createAnthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    })

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: toCoreMessages(messages ?? []),
      maxTokens: 1024,
    })

    return result.toUIMessageStreamResponse({
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
