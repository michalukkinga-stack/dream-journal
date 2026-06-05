import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const BASE = 'https://rrwynlvefmotlthypdcx.supabase.co/functions/v1'

function getToken(): string {
  const token = process.env.DREAM_JOURNAL_TOKEN
  if (!token) throw new Error('Brak zmiennej środowiskowej DREAM_JOURNAL_TOKEN')
  return token
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

async function apiGet(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const url = qs ? `${BASE}${path}?${qs}` : `${BASE}${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

const server = new Server(
  { name: 'dream-journal', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'add_dream',
      description:
        'Dodaje nowy wpis do dziennika snów. Jeśli nie podasz tagów — AI wywnioskuje je automatycznie z opisu.',
      inputSchema: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Opis snu (może zawierać HTML)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista tagów; jeśli pominięta — AI dobierze automatycznie',
          },
          date: {
            type: 'string',
            description: 'Data wpisu w formacie YYYY-MM-DD; domyślnie dzisiaj',
          },
        },
        required: ['description'],
      },
    },
    {
      name: 'ask_jung',
      description:
        'Zadaje pytanie agentowi AI wcielającemu się w rolę Carla Gustava Junga. Agent ma dostęp do snu z podanego dnia. Zwraca krótką odpowiedź po polsku.',
      inputSchema: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'Pytanie do Junga',
          },
          date: {
            type: 'string',
            description: 'Data snu w formacie YYYY-MM-DD; domyślnie dzisiaj',
          },
        },
        required: ['question'],
      },
    },
    {
      name: 'get_dream',
      description:
        'Pobiera wpis snu i historię czatu z Jungiem dla podanego dnia. Jeśli brak wpisu — pole dream wynosi null.',
      inputSchema: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Data w formacie YYYY-MM-DD; domyślnie dzisiaj',
          },
        },
        required: [],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params

  try {
    if (name === 'add_dream') {
      const result = await apiPost('/add-dream', args)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    }

    if (name === 'ask_jung') {
      const result = await apiPost('/ask-jung-api', args)
      return {
        content: [{ type: 'text', text: result.answer ?? JSON.stringify(result) }],
      }
    }

    if (name === 'get_dream') {
      const params: Record<string, string> = {}
      if (typeof args.date === 'string') params.date = args.date
      const result = await apiGet('/get-dream', params)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    }

    return {
      content: [{ type: 'text', text: `Nieznane narzędzie: ${name}` }],
      isError: true,
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Błąd: ${(err as Error).message}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
