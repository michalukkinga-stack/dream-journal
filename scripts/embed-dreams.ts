import { config } from 'dotenv'
config({ path: '.env.local' })
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 100

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in .env.local')
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const { data: dreams, error } = await supabase
    .from('dreams')
    .select('id, description, tags')
    .is('embedding', null)

  if (error) throw error
  if (!dreams || dreams.length === 0) {
    console.log('No dreams without embeddings found.')
    return
  }

  console.log(`Found ${dreams.length} dreams without embeddings`)

  for (let i = 0; i < dreams.length; i += BATCH_SIZE) {
    const batch = dreams.slice(i, i + BATCH_SIZE)
    const texts = batch.map(d =>
      `${stripHtml(d.description)} ${(d.tags as string[]).join(' ')}`
    )

    console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dreams.length / BATCH_SIZE)}...`)

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    })

    for (let j = 0; j < batch.length; j++) {
      const embedding = response.data[j].embedding
      const { error: updateError } = await supabase
        .from('dreams')
        .update({ embedding })
        .eq('id', batch[j].id)

      if (updateError) {
        console.error(`Failed to update dream ${batch[j].id}:`, updateError.message)
      }
    }

    console.log(`  ✓ ${Math.min(i + BATCH_SIZE, dreams.length)}/${dreams.length} embedded`)
  }

  console.log('\nDone.')
}

main().catch(console.error)
