import { createClient } from 'npm:@supabase/supabase-js@^2'
import { createAnthropic } from 'npm:@ai-sdk/anthropic@^3'
import { generateText } from 'npm:ai@^6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const AVAILABLE_TAGS = [
  'Radość','Strach','Smutek','Złość','Miłość','Tęsknota','Euforia','Spokój','Niepokój','Samotność',
  'Wstyd','Nostalgia','Zdziwienie','Ulga','Latanie','Ucieczka','Pościg','Walka','Podróż',
  'Transformacja','Poszukiwanie','Wspinaczka','Tonięcie','Spóźnienie','Zagubienie','Odkrycie',
  'Dom','Szkoła','Praca','Miasto','Las','Góry','Morze','Plaża','Pustynia','Przestrzeń kosmiczna',
  'Zamek','Podziemia','Labirynt','Cmentarz','Rynek','Dworzec','Hotel','Szpital','Kościół',
  'Woda','Ogień','Natura','Deszcz','Burza','Śnieg','Chmury','Księżyc','Słońce','Gwiazdy',
  'Wiatr','Mgła','Tęcza','Tornado','Powódź','Rodzina','Przyjaciele','Nieznajomi','Zwierzęta',
  'Dziecko','Starzec','Potwór','Duch','Anioł','Demon','Bohater','Koszmar','Lucydny',
  'Powracający','Spokojny','Dziwny','Kolorowy','Czarno-biały','Surrealistyczny','Realistyczny',
  'Symboliczny','Magia','Fantazja','Tajemnica','Dzieciństwo','Przeszłość','Przyszłość',
  'Muzyka','Jedzenie','Pieniądze','Śmierć','Narodziny','Ślub','Egzamin','Katastrofa','Supermoce',
]

async function inferTags(description: string): Promise<string[]> {
  const anthropic = createAnthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    maxTokens: 256,
    messages: [{
      role: 'user',
      content: `Na podstawie opisu snu wybierz 2-5 najbardziej pasujących tagów z poniższej listy. Odpowiedz TYLKO tablicą JSON z wybranymi tagami, nic więcej.

Dostępne tagi: ${AVAILABLE_TAGS.join(', ')}

Opis snu: ${description}`,
    }],
  })
  const match = text.trim().match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const tags: unknown[] = JSON.parse(match[0])
    return tags.filter((t): t is string => typeof t === 'string' && AVAILABLE_TAGS.includes(t))
  } catch {
    return []
  }
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

  let body: { description?: string; tags?: string[]; date?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const description = body.description ?? ''
  if (!description.trim()) {
    return new Response(JSON.stringify({ error: 'description is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Use provided date or today
  const today = new Date().toISOString().slice(0, 10)
  const date = body.date ?? today
  const created_at = `${date}T12:00:00`

  // Infer tags if not provided
  let tags = body.tags ?? []
  if (tags.length === 0) {
    tags = await inferTags(description)
  }

  const { data, error } = await supabase
    .from('dreams')
    .insert({ user_id: user.id, title: '', description, tags, created_at })
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  return new Response(JSON.stringify({
    id: data.id,
    description: data.description,
    tags: data.tags,
    date: data.created_at,
  }), { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
})
