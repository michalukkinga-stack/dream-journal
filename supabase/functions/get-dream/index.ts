import { createClient } from 'npm:@supabase/supabase-js@^2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

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

  const url = new URL(req.url)
  const today = new Date().toISOString().slice(0, 10)
  const date = url.searchParams.get('date') ?? today

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(JSON.stringify({ error: 'date must be in YYYY-MM-DD format' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Fetch dream for the given date
  const { data: dreams } = await supabase
    .from('dreams')
    .select('*')
    .gte('created_at', `${date}T00:00:00`)
    .lte('created_at', `${date}T23:59:59`)
    .limit(1)

  const dream = dreams?.[0] ?? null

  // Fetch chat messages for the given date (session_date is stored as YYYY-MM-DD)
  const { data: chatMessages } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_date', date)
    .order('created_at', { ascending: true })
    .limit(100)

  return new Response(JSON.stringify({
    date,
    dream: dream ? {
      id: dream.id,
      description: dream.description,
      description_plain: stripHtml(dream.description),
      tags: dream.tags,
      created_at: dream.created_at,
    } : null,
    chat: (chatMessages ?? []).map((m: { id: string; role: string; content: string; created_at: string }) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    })),
  }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
})
