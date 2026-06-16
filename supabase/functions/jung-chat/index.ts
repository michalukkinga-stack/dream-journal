import { createClient } from 'npm:@supabase/supabase-js@^2'
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getLastUserMessage(messages: UIMessage[]): string {
  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length === 0) return ''
  const last = userMessages[userMessages.length - 1]
  return last.parts
    ? last.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('')
    : (last.content ?? '')
}

async function getQueryEmbedding(text: string): Promise<number[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) throw new Error('OPENAI_API_KEY not set')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  const json = await res.json()
  return json.data[0].embedding as number[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const body = await req.json()
    const { messages, currentDream } = body as {
      messages: UIMessage[]
      currentDream?: { title: string; description: string; tags: string[]; createdAt: string }
      allDreams?: unknown  // ignored — replaced by hybrid search
    }

    let contextBlock = ''

    if (currentDream) {
      contextBlock += `\n\n--- AKTUALNIE OGLĄDANY SEN ---\nData: ${currentDream.createdAt}\nOpis: ${currentDream.description}\nMotywy/tagi: ${currentDream.tags?.join(', ') || 'brak'}`
    }

    // Hybrid search using the last user message
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const lastMessage = getLastUserMessage(messages)
          const queryText = lastMessage || 'sen marzenie nocne'
          const embedding = await getQueryEmbedding(queryText)

          const { data: searchResults } = await supabase.rpc('hybrid_search_dreams', {
            p_user_id: user.id,
            p_query_text: queryText,
            p_query_embedding: embedding,
            p_match_count: 10,
          })

          if (searchResults && searchResults.length > 0) {
            const dreamList = (searchResults as { description: string; tags: string[]; created_at: string }[])
              .map(d => `[${d.created_at.slice(0, 10)}] tagi: ${d.tags?.join(', ') || 'brak'} — ${stripHtml(d.description).slice(0, 200)}`)
              .join('\n')
            contextBlock += `\n\n--- TRAFNE SNY Z HISTORII ---\n${dreamList}`
          }
        }
      } catch (e) {
        console.error('Hybrid search failed:', e)
      }
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
