import { createClient } from 'npm:@supabase/supabase-js@^2'
import { createAnthropic } from 'npm:@ai-sdk/anthropic@^3'
import { generateText } from 'npm:ai@^6'
import { JUNG_SYSTEM_PROMPT } from '../_shared/jung-prompt.ts'

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
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
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
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

  const bucket = Math.floor(Date.now() / 60000)
  const { data: rateLimitOk } = await supabase.rpc('check_and_increment_rate_limit', {
    p_endpoint: 'ask-jung-api', p_bucket: bucket, p_limit: 20,
  })
  if (rateLimitOk === false) {
    return new Response(JSON.stringify({ error: 'Za dużo zapytań. Poczekaj chwilę.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  let body: { question?: string; date?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const question = body.question?.trim()
  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  const targetDate = body.date ?? today

  // Fetch the dream for the target date
  const { data: todayDreams } = await supabase
    .from('dreams')
    .select('*')
    .gte('created_at', `${targetDate}T00:00:00`)
    .lte('created_at', `${targetDate}T23:59:59`)
    .limit(1)

  const currentDream = todayDreams?.[0] ?? null

  // Hybrid search for relevant dreams
  let relevantDreams: { date: string; tags: string[]; summary: string }[] = []
  try {
    const embedding = await getQueryEmbedding(question)
    const { data: searchResults } = await supabase.rpc('hybrid_search_dreams', {
      p_user_id: user.id,
      p_query_text: question,
      p_query_embedding: embedding,
      p_match_count: 10,
    })
    relevantDreams = (searchResults ?? []).map((d: { description: string; tags: string[]; created_at: string }) => ({
      date: d.created_at.slice(0, 10),
      tags: d.tags,
      summary: stripHtml(d.description).slice(0, 200),
    }))
  } catch (e) {
    console.error('Hybrid search failed, falling back to recent dreams:', e)
    const { data: fallback } = await supabase
      .from('dreams')
      .select('description, tags, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    relevantDreams = (fallback ?? []).map((d: { description: string; tags: string[]; created_at: string }) => ({
      date: d.created_at.slice(0, 10),
      tags: d.tags,
      summary: stripHtml(d.description).slice(0, 200),
    }))
  }

  let contextBlock = ''
  if (currentDream) {
    contextBlock += `\n\n--- SEN Z DNIA ${targetDate} ---\nOpis: ${stripHtml(currentDream.description)}\nMotywy/tagi: ${currentDream.tags?.join(', ') || 'brak'}`
  }
  if (relevantDreams.length > 0) {
    const dreamList = relevantDreams
      .map(d => `[${d.date}] tagi: ${d.tags?.join(', ') || 'brak'} — ${d.summary}`)
      .join('\n')
    contextBlock += `\n\n--- TRAFNE SNY Z HISTORII ---\n${dreamList}`
  }

  const anthropic = createAnthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })
  const { text: answer } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    maxTokens: 1024,
    system: JUNG_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: contextBlock ? `${contextBlock}\n\n${question}` : question },
    ],
    providerOptions: {
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
  })

  return new Response(JSON.stringify({ answer, date: targetDate }), {
    status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
