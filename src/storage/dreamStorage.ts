import { supabase } from '@/lib/supabaseClient'
import { Dream } from '@/types/dream'

type DbDream = {
  id: string
  user_id: string
  title: string
  description: string
  tags: string[]
  created_at: string
}

function toAppDream(d: DbDream): Dream {
  return { id: d.id, title: d.title, description: d.description, tags: d.tags, createdAt: d.created_at }
}

export async function getDreams(): Promise<Dream[]> {
  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return (data as DbDream[]).map(toAppDream)
}

export async function getDreamById(id: string): Promise<Dream | undefined> {
  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return toAppDream(data as DbDream)
}

export async function saveDream(dream: Omit<Dream, 'id' | 'createdAt'> & { tags?: string[]; dateOverride?: string }): Promise<Dream> {
  const user = (await supabase.auth.getUser()).data.user
  const row: Record<string, unknown> = {
    title: dream.title,
    description: dream.description ?? '',
    tags: dream.tags ?? [],
    user_id: user!.id,
  }
  if (dream.dateOverride) row.created_at = dream.dateOverride
  const { data, error } = await supabase
    .from('dreams')
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return toAppDream(data as DbDream)
}

export async function deleteDream(id: string): Promise<void> {
  await supabase.from('dreams').delete().eq('id', id)
}

export async function updateDream(id: string, patch: Partial<Omit<Dream, 'id' | 'createdAt'>>): Promise<void> {
  await supabase.from('dreams').update(patch).eq('id', id)
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}
