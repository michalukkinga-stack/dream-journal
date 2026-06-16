import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const USER_ID = '8b53dd61-4e30-4b55-b27d-f5a2f56f84d1'
const TOTAL_DREAMS = 200
const BATCH_SIZE = 10

const TAGS = [
  'Radość','Strach','Smutek','Złość','Miłość','Tęsknota','Euforia','Spokój','Niepokój','Samotność',
  'Wstyd','Nostalgia','Zdziwienie','Ulga','Latanie','Ucieczka','Pościg','Walka','Podróż','Transformacja',
  'Poszukiwanie','Wspinaczka','Tonięcie','Spóźnienie','Zagubienie','Odkrycie','Dom','Szkoła','Praca',
  'Miasto','Las','Góry','Morze','Plaża','Pustynia','Przestrzeń kosmiczna','Zamek','Podziemia','Labirynt',
  'Cmentarz','Rynek','Dworzec','Hotel','Szpital','Kościół','Woda','Ogień','Natura','Deszcz','Burza',
  'Śnieg','Chmury','Księżyc','Słońce','Gwiazdy','Wiatr','Mgła','Tęcza','Tornado','Powódź','Rodzina',
  'Przyjaciele','Nieznajomi','Zwierzęta','Dziecko','Starzec','Potwór','Duch','Anioł','Demon','Bohater',
  'Koszmar','Lucydny','Powracający','Spokojny','Dziwny','Kolorowy','Czarno-biały','Surrealistyczny',
  'Realistyczny','Symboliczny','Magia','Fantazja','Tajemnica','Dzieciństwo','Przeszłość','Przyszłość',
  'Muzyka','Jedzenie','Pieniądze','Śmierć','Narodziny','Ślub','Egzamin','Katastrofa','Supermoce',
]

function randomDates(count: number): string[] {
  const start = new Date('2022-01-01').getTime()
  const end = new Date('2025-12-31').getTime()
  const dates = new Set<string>()
  while (dates.size < count) {
    const d = new Date(start + Math.random() * (end - start))
    dates.add(d.toISOString().slice(0, 10))
  }
  return [...dates].sort()
}

function pickTags(description: string): string[] {
  const lower = description.toLowerCase()
  const matched = TAGS.filter(t => lower.includes(t.toLowerCase()))
  const shuffled = TAGS.filter(t => !matched.includes(t)).sort(() => Math.random() - 0.5)
  const combined = [...matched, ...shuffled].slice(0, Math.min(matched.length + 2, 6))
  return combined.slice(0, Math.max(3, combined.length))
}

async function generateBatch(client: Anthropic, batchIndex: number, dates: string[]): Promise<{ description: string; tags: string[]; date: string }[]> {
  const prompt = `Wygeneruj ${dates.length} realistycznych, zróżnicowanych opisów snów dla polskiej kobiety (~30 lat).
Każdy sen powinien być inny — używaj różnych motywów: lasy, góry, szkoła, rodzina, zwierzęta, podróże, koszmary, sny lucydne, surrealistyczne, spokojne, emocjonalne.
Pisz w pierwszej osobie, po polsku. Długość: 3-6 zdań na sen. Bez tytułów.

Odpowiedz TYLKO jako JSON array z polami "description" i "tags" (tablica 3-6 tagów z tej listy):
${TAGS.join(', ')}

Daty snów (tylko do celów orientacyjnych, nie wspominaj ich w treści): ${dates.join(', ')}

Format: [{"description": "...", "tags": ["...", "..."]}, ...]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Batch ${batchIndex}: no JSON found`)

  const parsed: { description: string; tags: string[] }[] = JSON.parse(jsonMatch[0])
  return parsed.map((item, i) => ({
    description: `<p>${item.description}</p>`,
    tags: (item.tags ?? []).filter(t => TAGS.includes(t)).slice(0, 6),
    date: dates[i],
  }))
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const dates = randomDates(TOTAL_DREAMS)
  console.log(`Generated ${dates.length} unique dates from 2022 to 2025`)

  let inserted = 0
  for (let i = 0; i < TOTAL_DREAMS; i += BATCH_SIZE) {
    const batchDates = dates.slice(i, i + BATCH_SIZE)
    console.log(`Generating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(TOTAL_DREAMS / BATCH_SIZE)}...`)

    const dreams = await generateBatch(anthropic, i, batchDates)

    const rows = dreams.map(d => ({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      title: '',
      description: d.description,
      tags: d.tags,
      created_at: `${d.date}T${String(Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
    }))

    const { error } = await supabase.from('dreams').insert(rows)
    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message)
    } else {
      inserted += rows.length
      console.log(`  ✓ Inserted ${inserted}/${TOTAL_DREAMS}`)
    }
  }

  console.log(`\nDone. Total inserted: ${inserted}`)
}

main().catch(console.error)
