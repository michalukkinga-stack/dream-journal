import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_BASE = 'https://rrwynlvefmotlthypdcx.supabase.co/functions/v1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, mcp-session-id',
}

// ── Tool definitions ─────────────────────────────────────────────
const TOOLS = [
  {
    name: 'add_dream',
    description:
      'Dodaje nowy wpis do dziennika snów. Jeśli nie podasz tagów — AI wywnioskuje je automatycznie z opisu.',
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
    description:
      'Zadaje pytanie agentowi AI wcielającemu się w Carla Gustava Junga. Zwraca interpretację snu po polsku.',
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
    description:
      'Pobiera wpis snu i historię czatu z Jungiem dla podanego dnia.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Data YYYY-MM-DD; domyślnie dzisiaj' },
      },
      required: [],
    },
  },
]

// ── API helpers ──────────────────────────────────────────────────
function getToken(req: VercelRequest): string {
  const auth = req.headers['authorization'] as string | undefined
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const envToken = process.env.DREAM_JOURNAL_TOKEN
  if (envToken) return envToken
  throw new Error('Brak tokenu: ustaw nagłówek Authorization lub zmienną DREAM_JOURNAL_TOKEN')
}

async function apiPost(token: string, path: string, body: unknown) {
  const res = await fetch(`${SUPABASE_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error((data.error as string) ?? `HTTP ${res.status}`)
  return data
}

async function apiGet(token: string, path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const url = qs ? `${SUPABASE_BASE}${path}?${qs}` : `${SUPABASE_BASE}${path}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error((data.error as string) ?? `HTTP ${res.status}`)
  return data
}

// ── Tool dispatch ────────────────────────────────────────────────
async function callTool(token: string, name: string, args: Record<string, unknown>) {
  if (name === 'add_dream') {
    const result = await apiPost(token, '/add-dream', args)
    return JSON.stringify(result, null, 2)
  }
  if (name === 'ask_jung') {
    const result = await apiPost(token, '/ask-jung-api', args)
    return (result.answer as string) ?? JSON.stringify(result)
  }
  if (name === 'get_dream') {
    const params: Record<string, string> = {}
    if (typeof args.date === 'string') params.date = args.date
    const result = await apiGet(token, '/get-dream', params)
    return JSON.stringify(result, null, 2)
  }
  throw new Error(`Nieznane narzędzie: ${name}`)
}

function setCors(res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
}

// ── JSON-RPC handler ─────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jsonrpc, id, method, params } = req.body as {
    jsonrpc: string
    id: number | string | null
    method: string
    params?: Record<string, unknown>
  }

  const ok = (result: unknown) =>
    res.status(200).json({ jsonrpc: '2.0', id, result })

  const err = (code: number, message: string) =>
    res.status(200).json({ jsonrpc: '2.0', id, error: { code, message } })

  try {
    // MCP initialization
    if (method === 'initialize') {
      return ok({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'dream-journal', version: '1.0.0' },
      })
    }

    if (method === 'notifications/initialized') {
      return res.status(200).set(CORS).end()
    }

    // List tools
    if (method === 'tools/list') {
      return ok({ tools: TOOLS })
    }

    // Call tool
    if (method === 'tools/call') {
      const { name, arguments: args = {} } = params as {
        name: string
        arguments?: Record<string, unknown>
      }
      let token: string
      try {
        token = getToken(req)
      } catch (e) {
        return err(-32001, (e as Error).message)
      }
      try {
        const text = await callTool(token, name, args)
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
