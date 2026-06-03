import { supabase } from '@/lib/supabaseClient'

export type StoredMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export async function getChatMessages(sessionDate: string): Promise<StoredMessage[]> {
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
