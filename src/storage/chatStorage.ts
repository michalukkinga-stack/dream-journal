import { supabase } from '@/lib/supabaseClient'

export type StoredMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const LOCAL_KEY = 'dev_chat_messages'

function getLocalMessages(sessionDate: string): StoredMessage[] {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') as Record<string, StoredMessage[]>
    return all[sessionDate] ?? []
  } catch { return [] }
}

function saveLocalMessage(msg: StoredMessage, sessionDate: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') as Record<string, StoredMessage[]>
    all[sessionDate] = [...(all[sessionDate] ?? []), msg]
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

export async function getChatMessages(sessionDate: string): Promise<StoredMessage[]> {
  if (!(await isAuthenticated())) return getLocalMessages(sessionDate)
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_date', sessionDate)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) { console.error(error); return [] }
  return data.map(d => ({ id: d.id, role: d.role, content: d.content, createdAt: d.created_at }))
}

export async function saveChatMessage(
  role: 'user' | 'assistant',
  content: string,
  sessionDate: string,
  contextDreamId?: string
): Promise<void> {
  if (!(await isAuthenticated())) {
    saveLocalMessage({ id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() }, sessionDate)
    return
  }
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  await supabase.from('chat_messages').insert({
    user_id: user.id,
    role,
    content,
    session_date: sessionDate,
    context_dream_id: contextDreamId ?? null,
  })
}
