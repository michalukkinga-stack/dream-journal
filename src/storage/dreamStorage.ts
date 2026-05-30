import { Dream } from '@/types/dream'

const STORAGE_KEY = '@dreams'
const INITIALIZED_KEY = '@dreams_initialized'

const SEED_DREAM: Dream = {
  id: 'seed-1',
  title: 'Latanie nad miastem',
  description:
    '<p>Leciałam nad nocnym miastem pokrytym mgłą. Ulice świeciły złotymi lampami, a powietrze było ciepłe i spokojne. Czułam się lekka, jakby wszystkie troski zostały na ziemi.</p><p>Gdzieś w oddali widać było rzekę – srebrną wstęgę wijącą się między dzielnicami. Nikt mnie nie widział, ale ja widziałam wszystko.</p>',
  tags: ['Latanie', 'Miasto', 'Spokojny', 'Kolorowy'],
  createdAt: new Date('2026-05-27T06:30:00').toISOString(),
}

// Bezpieczny dostęp do localStorage — nie rzuca na iOS Safari private/restricted
function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* ignoruj */ }
}
function lsRemove(key: string): void {
  try { localStorage.removeItem(key) } catch { /* ignoruj */ }
}

export const storage = { get: lsGet, set: lsSet, remove: lsRemove }

export function initStorage(): void {
  try {
    const initialized = lsGet(INITIALIZED_KEY)
    if (!initialized) {
      lsSet(STORAGE_KEY, JSON.stringify([SEED_DREAM]))
      lsSet(INITIALIZED_KEY, 'true')
    }
  } catch { /* nic — aplikacja ruszy bez seed data */ }
}

export function getDreams(): Dream[] {
  try {
    const raw = lsGet(STORAGE_KEY)
    if (!raw) return []
    const dreams: Dream[] = JSON.parse(raw)
    return dreams
      .map(d => ({ ...d, tags: d.tags ?? [] }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch { return [] }
}

export function getDreamById(id: string): Dream | undefined {
  return getDreams().find((d) => d.id === id)
}

export function saveDream(dream: Omit<Dream, 'id' | 'createdAt'> & { tags?: string[] }): Dream {
  const newDream: Dream = {
    ...dream,
    tags: dream.tags ?? [],
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  }
  const existing = getDreams()
  lsSet(STORAGE_KEY, JSON.stringify([newDream, ...existing]))
  return newDream
}

export function deleteDream(id: string): void {
  const updated = getDreams().filter((d) => d.id !== id)
  lsSet(STORAGE_KEY, JSON.stringify(updated))
}

export function updateDream(id: string, patch: Partial<Omit<Dream, 'id' | 'createdAt'>>): void {
  const dreams = getDreams()
  const updated = dreams.map((d) => d.id === id ? { ...d, ...patch } : d)
  lsSet(STORAGE_KEY, JSON.stringify(updated))
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
