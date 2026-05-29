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

export function initStorage(): void {
  const initialized = localStorage.getItem(INITIALIZED_KEY)
  if (!initialized) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([SEED_DREAM]))
    localStorage.setItem(INITIALIZED_KEY, 'true')
  }
}

export function getDreams(): Dream[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  const dreams: Dream[] = JSON.parse(raw)
  return dreams.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getDreamById(id: string): Dream | undefined {
  return getDreams().find((d) => d.id === id)
}

export function saveDream(dream: Omit<Dream, 'id' | 'createdAt'> & { tags?: string[] }): Dream {
  const newDream: Dream = {
    ...dream,
    tags: dream.tags ?? [],
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const existing = getDreams()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newDream, ...existing]))
  return newDream
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
