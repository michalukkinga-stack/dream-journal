import { supabase } from '@/lib/supabaseClient'
import { Dream } from '@/types/dream'

type DbDream = {
  id: string
  user_id: string
  title: string
  description: string
  tags: string[]
  photo_urls: string[]
  created_at: string
}

function toAppDream(d: DbDream): Dream {
  return { id: d.id, title: d.title, description: d.description, tags: d.tags, photoUrls: d.photo_urls ?? [], createdAt: d.created_at }
}

// ── localStorage fallback (dev / unauthenticated) ─────────────────────────────
const LOCAL_KEY = 'dev_dreams'

function getLocalDreams(): Dream[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function setLocalDreams(dreams: Dream[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(dreams))
}

async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}
// ─────────────────────────────────────────────────────────────────────────────

export async function getDreams(): Promise<Dream[]> {
  if (!(await isAuthenticated())) return getLocalDreams()

  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return (data as DbDream[]).map(toAppDream)
}

export async function getDreamById(id: string): Promise<Dream | undefined> {
  if (!(await isAuthenticated())) {
    return getLocalDreams().find(d => d.id === id)
  }

  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return toAppDream(data as DbDream)
}

export async function saveDream(dream: Omit<Dream, 'id' | 'createdAt'> & { tags?: string[]; photoUrls?: string[]; dateOverride?: string }): Promise<Dream> {
  if (!(await isAuthenticated())) {
    const newDream: Dream = {
      id: crypto.randomUUID(),
      title: dream.title,
      description: dream.description ?? '',
      tags: dream.tags ?? [],
      photoUrls: [],
      createdAt: dream.dateOverride ?? new Date().toISOString(),
    }
    const dreams = getLocalDreams()
    setLocalDreams([newDream, ...dreams])
    return newDream
  }

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
  if (!(await isAuthenticated())) {
    setLocalDreams(getLocalDreams().filter(d => d.id !== id))
    return
  }
  await supabase.from('dreams').delete().eq('id', id)
}

export async function updateDream(id: string, patch: Partial<Omit<Dream, 'id' | 'createdAt'>>): Promise<void> {
  if (!(await isAuthenticated())) {
    setLocalDreams(getLocalDreams().map(d => d.id === id ? { ...d, ...patch } : d))
    return
  }
  const dbPatch: Record<string, unknown> = {}
  if (patch.title !== undefined) dbPatch.title = patch.title
  if (patch.description !== undefined) dbPatch.description = patch.description
  if (patch.tags !== undefined) dbPatch.tags = patch.tags
  if (patch.photoUrls !== undefined) dbPatch.photo_urls = patch.photoUrls
  await supabase.from('dreams').update(dbPatch).eq('id', id)
}

const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_PHOTO_BYTES = 10 * 1024 * 1024 // 10 MB

export async function uploadDreamPhoto(dreamId: string, file: File): Promise<string> {
  if (!(ALLOWED_PHOTO_MIME as readonly string[]).includes(file.type)) {
    throw new Error(`Niedozwolony typ pliku. Dozwolone: JPEG, PNG, WebP, GIF.`)
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`Plik za duży. Maksymalny rozmiar to 10 MB.`)
  }
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  }
  const ext = mimeToExt[file.type] ?? 'jpg'
  const path = `${user.id}/${dreamId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('dream-photos').upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('dream-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function deleteDreamPhoto(url: string): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  // Extract path from public URL: everything after /object/public/dream-photos/
  const marker = '/object/public/dream-photos/'
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await supabase.storage.from('dream-photos').remove([path])
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca',
    'lipca','sierpnia','września','października','listopada','grudnia']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}
