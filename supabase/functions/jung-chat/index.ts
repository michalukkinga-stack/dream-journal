import { createClient } from 'npm:@supabase/supabase-js@^2'
import { createAnthropic } from 'npm:@ai-sdk/anthropic@^3'
import { streamText } from 'npm:ai@^6'
import { getSystemPrompt } from '../_shared/jung-prompt.ts'

function getCorsHeaders(reqOrigin: string | null): Record<string, string> {
  const prod = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://dream-journal-five.vercel.app'
  const allowed = [prod, 'http://localhost:5173', 'http://localhost:4173']
  const origin = reqOrigin && allowed.includes(reqOrigin) ? reqOrigin : prod
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }
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

async function checkRateLimit(supabase: ReturnType<typeof createClient>, endpoint: string): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 60000)
  const { data } = await supabase.rpc('check_and_increment_rate_limit', {
    p_endpoint: endpoint,
    p_bucket: bucket,
    p_limit: 20,
  })
  return data === true
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const allowed = await checkRateLimit(supabase, 'jung-chat')
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Za dużo zapytań. Poczekaj chwilę i spróbuj ponownie.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    const body = await req.json()
    const { messages, currentDream, persona } = body as {
      messages: UIMessage[]
      currentDream?: { title: string; description: string; tags: string[]; createdAt: string }
      allDreams?: unknown
      persona?: string
    }

    // Weryfikacja zakupu dla płatnych person (po stronie serwera)
    const PAID_PERSONAS = ['neurobiolog', 'wrozbit']
    if (persona && PAID_PERSONAS.includes(persona)) {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('therapist_id', persona)
        .maybeSingle()

      if (!purchase) {
        return new Response(
          JSON.stringify({ error: `Przewodnik "${persona}" wymaga zakupu. Odblokuj go w ustawieniach aplikacji.` }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }
    }

    let contextBlock = ''

    if (currentDream) {
      contextBlock += `\n\n--- AKTUALNIE OGLĄDANY SEN ---\nData: ${currentDream.createdAt}\nOpis: ${stripHtml(currentDream.description)}\nMotywy/tagi: ${currentDream.tags?.join(', ') || 'brak'}`
    }

    try {
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
    } catch (e) {
      console.error('Hybrid search failed:', e)
    }

    const coreMessages = toCoreMessages(messages ?? [])
    const messagesWithContext = contextBlock && coreMessages.length > 0 && coreMessages[0].role === 'user'
      ? [
          { ...coreMessages[0], content: `${contextBlock}\n\n${coreMessages[0].content}` },
          ...coreMessages.slice(1),
        ]
      : coreMessages

    const anthropic = createAnthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    })

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: getSystemPrompt(persona ?? 'jung'),
      messages: messagesWithContext,
      maxTokens: 1024,
      providerOptions: {
        anthropic: { cacheControl: { type: 'ephemeral' } },
      },
    })

    return result.toUIMessageStreamResponse({ headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
