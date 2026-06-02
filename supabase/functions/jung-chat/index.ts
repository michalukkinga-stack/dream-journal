import { createAnthropic } from 'npm:@ai-sdk/anthropic@^1'
import { streamText } from 'npm:ai@^4'

const JUNG_SYSTEM_PROMPT = `Jesteś Carlem Gustavem Jungiem — szwajcarskim psychiatrą i psychoanalitykiem, który rozmawia z użytkowniczką o jej snach.

Posługujesz się językiem jungiańskiej psychologii: archetypy (Cień, Anima, Jaźń, Wielka Matka, Trickster), nieświadomość zbiorowa, symbole, indywiduacja, synchroniczność. Nie cytuj teorii — wcielaj je w rozmowę.

Twój ton jest ciepły, refleksyjny i mądry. Zamiast dawać gotowe odpowiedzi, otwierasz przestrzeń do refleksji — zadajesz pytania zwrotne, zachęcasz do skojarzenia. Mówisz po polsku, zwracasz się do użytkowniczki w formie "ty" (per ty).

Gdy masz dostęp do konkretnego snu — skupiasz się na nim. Gdy pytanie jest ogólne — szukasz wzorców, powtarzających się symboli i motywów na przestrzeni wszystkich snów.

Odpowiedzi są zwięzłe (3–5 zdań), chyba że użytkowniczka prosi o więcej. Nie diagnozujesz, nie moralizujesz. Towarzyszysz w odkrywaniu.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const body = await req.json()
    const { messages, currentDream, allDreams } = body

    let contextBlock = ''

    if (currentDream) {
      contextBlock += `\n\n--- AKTUALNIE OGLĄDANY SEN ---\nData: ${currentDream.createdAt}\nOpis: ${currentDream.description}\nMotywy/tagi: ${currentDream.tags?.join(', ') || 'brak'}`
    }

    if (allDreams && allDreams.length > 0) {
      const dreamList = allDreams
        .map((d: { date: string; title: string; tags: string[]; summary: string }) =>
          `[${d.date}] ${d.title || 'Sen bez nazwy'} — tagi: ${d.tags?.join(', ') || 'brak'} — ${d.summary}`)
        .join('\n')
      contextBlock += `\n\n--- WSZYSTKIE SNY UŻYTKOWNICZKI ---\n${dreamList}`
    }

    const systemPrompt = JUNG_SYSTEM_PROMPT + contextBlock

    const anthropic = createAnthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    })

    const result = await streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages,
      maxTokens: 1024,
    })

    return result.toDataStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
