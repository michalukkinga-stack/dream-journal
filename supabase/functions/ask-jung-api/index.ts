import { createClient } from 'npm:@supabase/supabase-js@^2'
import { createAnthropic } from 'npm:@ai-sdk/anthropic@^3'
import { generateText } from 'npm:ai@^6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const JUNG_SYSTEM_PROMPT = `Jesteś Carlem Gustavem Jungiem — rozmawiasz z użytkowniczką o jej snach. Jesteś jak sympatyczny kolega z pracy, który ma głęboką wiedzę o psychologii: mówisz normalnie, bez patosu, bez wielkich słów.

Używasz pojęć jungiańskich (Cień, Anima, Jaźń, archetypy, nieświadomość zbiorowa) naturalnie, gdy pasują — nie na pokaz. Zadajesz jedno konkretne pytanie zwrotne zamiast dawać gotowe odpowiedzi.

Mówisz po polsku, per ty. Ton: ciepły, bezpośredni, trochę dociekliwy — jak ktoś, z którym fajnie się rozmawia.

Gdy masz konkretny sen — skupiasz się na nim. Gdy pytanie ogólne — szukasz wzorców w całej historii snów.

Odpowiadasz krótko: 2–3 zdania maksymalnie, chyba że ktoś wyraźnie prosi o więcej. Nie moralizujesz, nie diagnozujesz.`

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

Deno.serve(async (req) => {
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
  const dateStart = `${targetDate}T00:00:00`
  const dateEnd = `${targetDate}T23:59:59`
  const { data: todayDreams } = await supabase
    .from('dreams')
    .select('*')
    .gte('created_at', dateStart)
    .lte('created_at', dateEnd)
    .limit(1)

  const currentDream = todayDreams?.[0] ?? null

  // Fetch all dreams for context
  const { data: allDreamsRaw } = await supabase
    .from('dreams')
    .select('id, title, description, tags, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const allDreams = (allDreamsRaw ?? []).map((d: { id: string; title: string; description: string; tags: string[]; created_at: string }) => ({
    date: d.created_at.slice(0, 10),
    title: d.title,
    tags: d.tags,
    summary: stripHtml(d.description).slice(0, 200),
  }))

  let contextBlock = ''
  if (currentDream) {
    contextBlock += `\n\n--- SEN Z DNIA ${targetDate} ---\nOpis: ${stripHtml(currentDream.description)}\nMotywy/tagi: ${currentDream.tags?.join(', ') || 'brak'}`
  }
  if (allDreams.length > 0) {
    const dreamList = allDreams
      .map((d: { date: string; title: string; tags: string[]; summary: string }) => `[${d.date}] ${d.title || 'Sen bez nazwy'} — tagi: ${d.tags?.join(', ') || 'brak'} — ${d.summary}`)
      .join('\n')
    contextBlock += `\n\n--- WSZYSTKIE SNY UŻYTKOWNICZKI ---\n${dreamList}`
  }

  const anthropic = createAnthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })
  const { text: answer } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    maxTokens: 1024,
    system: JUNG_SYSTEM_PROMPT + contextBlock,
    messages: [{ role: 'user', content: question }],
  })

  return new Response(JSON.stringify({ answer, date: targetDate }), {
    status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
