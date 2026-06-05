import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = 'https://rrwynlvefmotlthypdcx.supabase.co'
const USER_ID = '8b53dd61-4e30-4b55-b27d-f5a2f56f84d1'

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

function getServiceKey(): string {
  const key = process.env.DREAM_JOURNAL_TOKEN
  if (!key) throw new Error('Brak DREAM_JOURNAL_TOKEN w env')
  return key
}

function supabaseHeaders(key: string) {
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'return=representation',
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function inferTags(description: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Na podstawie opisu snu wybierz 2-5 najbardziej pasujących tagów z poniższej listy. Odpowiedz TYLKO tablicą JSON z wybranymi tagami, nic więcej.\n\nDostępne tagi: ${AVAILABLE_TAGS.join(', ')}\n\nOpis snu: ${description}`,
      }],
    }),
  })
  if (!res.ok) return []
  const data = await res.json() as { content: { text: string }[] }
  const text = data.content?.[0]?.text ?? ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const tags: unknown[] = JSON.parse(match[0])
    return tags.filter((t): t is string => typeof t === 'string' && AVAILABLE_TAGS.includes(t))
  } catch { return [] }
}

// ── Tools ────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'add_dream',
    description: 'Dodaje nowy wpis do dziennika snów. Jeśli nie podasz tagów — AI wywnioskuje je automatycznie z opisu.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Opis snu (może zawierać HTML)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Lista tagów; opcjonalna' },
        date: { type: 'string', description: 'Data YYYY-MM-DD; domyślnie dzisiaj' },
      },
      required: ['description'],
    },
  },
  {
    name: 'ask_jung',
    description: 'Zadaje pytanie agentowi AI wcielającemu się w Carla Gustava Junga. Zwraca interpretację snu po polsku.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Pytanie do Junga' },
        date: { type: 'string', description: 'Data snu YYYY-MM-DD; domyślnie dzisiaj' },
      },
      required: ['question'],
    },
  },
  {
    name: 'get_dream',
    description: 'Pobiera wpis snu i historię czatu z Jungiem dla podanego dnia.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Data YYYY-MM-DD; domyślnie dzisiaj' },
      },
      required: [],
    },
  },
]

// ── Tool handlers ────────────────────────────────────────────────
async function handleAddDream(args: Record<string, unknown>) {
  const key = getServiceKey()
  const description = args.description as string
  const today = new Date().toISOString().slice(0, 10)
  const date = (args.date as string | undefined) ?? today
  const created_at = `${date}T12:00:00`

  let tags = (args.tags as string[] | undefined) ?? []
  if (tags.length === 0) {
    tags = await inferTags(stripHtml(description))
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/dreams`, {
    method: 'POST',
    headers: supabaseHeaders(key),
    body: JSON.stringify({ user_id: USER_ID, title: '', description, tags, created_at }),
  })
  const data = await res.json() as Record<string, unknown>[]
  if (!res.ok) throw new Error(JSON.stringify(data))
  return JSON.stringify(data[0], null, 2)
}

async function handleGetDream(args: Record<string, unknown>) {
  const key = getServiceKey()
  const today = new Date().toISOString().slice(0, 10)
  const date = (args.date as string | undefined) ?? today
  const dateStart = `${date}T00:00:00`
  const dateEnd = `${date}T23:59:59`

  const [dreamRes, chatRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/dreams?user_id=eq.${USER_ID}&created_at=gte.${dateStart}&created_at=lte.${dateEnd}&order=created_at.desc&limit=1`,
      { headers: supabaseHeaders(key) }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/chat_messages?user_id=eq.${USER_ID}&created_at=gte.${dateStart}&created_at=lte.${dateEnd}&order=created_at.asc&limit=100`,
      { headers: supabaseHeaders(key) }
    ),
  ])

  const dreams = await dreamRes.json() as Record<string, unknown>[]
  const chat = await chatRes.json() as Record<string, unknown>[]
  const dream = dreams[0] ?? null

  return JSON.stringify({ date, dream, chat }, null, 2)
}

async function handleAskJung(args: Record<string, unknown>) {
  const key = getServiceKey()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return 'Brak ANTHROPIC_API_KEY w env Vercel — dodaj go przez vercel env add ANTHROPIC_API_KEY production'

  const question = args.question as string
  const today = new Date().toISOString().slice(0, 10)
  const date = (args.date as string | undefined) ?? today
  const dateStart = `${date}T00:00:00`
  const dateEnd = `${date}T23:59:59`

  const dreamRes = await fetch(
    `${SUPABASE_URL}/rest/v1/dreams?user_id=eq.${USER_ID}&created_at=gte.${dateStart}&created_at=lte.${dateEnd}&order=created_at.desc&limit=1`,
    { headers: supabaseHeaders(key) }
  )
  const dreams = await dreamRes.json() as Record<string, unknown>[]
  const dream = dreams[0]
  const dreamText = dream ? stripHtml(dream.description as string) : 'Brak wpisu na ten dzień.'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: `Jesteś Carlem Gustavem Jungiem. Odpowiadasz krótko, po polsku, w sposób koleżeński i ciepły. Analizujesz sny przez pryzmat psychologii analitycznej. Sen użytkownika z dnia ${date}: ${dreamText}`,
      messages: [{ role: 'user', content: question }],
    }),
  })
  const data = await res.json() as { content: { text: string }[] }
  return data.content?.[0]?.text ?? 'Brak odpowiedzi'
}

// ── Main handler ─────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, mcp-session-id')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id, method, params } = req.body as {
    jsonrpc: string
    id: number | string | null
    method: string
    params?: Record<string, unknown>
  }

  const ok = (result: unknown) => res.status(200).json({ jsonrpc: '2.0', id, result })
  const err = (code: number, message: string) => res.status(200).json({ jsonrpc: '2.0', id, error: { code, message } })

  try {
    if (method === 'initialize') {
      return ok({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'dream-journal', version: '1.0.0' },
      })
    }
    if (method === 'notifications/initialized') return res.status(200).end()
    if (method === 'tools/list') return ok({ tools: TOOLS })

    if (method === 'tools/call') {
      const { name, arguments: args = {} } = params as { name: string; arguments?: Record<string, unknown> }
      try {
        let text: string
        if (name === 'add_dream') text = await handleAddDream(args)
        else if (name === 'get_dream') text = await handleGetDream(args)
        else if (name === 'ask_jung') text = await handleAskJung(args)
        else return err(-32601, `Nieznane narzędzie: ${name}`)
        return ok({ content: [{ type: 'text', text }] })
      } catch (e) {
        return ok({ content: [{ type: 'text', text: `Błąd: ${(e as Error).message}` }], isError: true })
      }
    }

    return err(-32601, `Nieznana metoda: ${method}`)
  } catch (e) {
    return err(-32603, (e as Error).message)
  }
}
