import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, Trash2 } from 'lucide-react'
import { getDreams, formatDate, deleteDream } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { MobileHeader } from '@/components/MobileHeader'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const PILL = 'font-ui px-3 h-6 flex items-center rounded-full text-xs font-light shrink-0 border border-white/20 text-white/60'
const GAP = 6 // gap-1.5

function TagRowDesktop({ tags }: { tags: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(tags.length)

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const calculate = () => {
      const items = Array.from(measure.children) as HTMLElement[]
      if (!items.length) return
      const ellipsisW = items[items.length - 1].offsetWidth
      const maxW = container.clientWidth
      let used = 0
      let count = 0
      for (let i = 0; i < tags.length; i++) {
        const tagW = items[i].offsetWidth
        const spaceBefore = i > 0 ? GAP : 0
        const isLast = i === tags.length - 1
        const ellipsisSpace = isLast ? 0 : GAP + ellipsisW
        if (used + spaceBefore + tagW + ellipsisSpace <= maxW) {
          used += spaceBefore + tagW
          count = i + 1
        } else {
          break
        }
      }
      setVisibleCount(Math.max(1, count))
    }

    calculate()
    const ro = new ResizeObserver(calculate)
    ro.observe(container)
    return () => ro.disconnect()
  }, [tags])

  const showEllipsis = visibleCount < tags.length

  return (
    <div className="relative mt-3">
      {/* hidden measurement row */}
      <div ref={measureRef} className="absolute invisible flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
        {tags.map(tag => <span key={tag} className={PILL}>{tag}</span>)}
        <span className={PILL}>. . .</span>
      </div>
      {/* visible row */}
      <div ref={containerRef} className="flex items-center gap-1.5 overflow-hidden">
        {tags.slice(0, visibleCount).map(tag => (
          <span key={tag} className={PILL}>{tag}</span>
        ))}
        {showEllipsis && <span className={PILL}>. . .</span>}
      </div>
    </div>
  )
}

export function AllDreamsPage() {
  const navigate = useNavigate()
  const [dreams, setDreams] = useState<Dream[]>([])
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    getDreams().then(data => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setDreams(sorted)
    })
  }, [])

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!window.confirm('Usunąć ten wpis?')) return
    setDeletingId(id)
    await deleteDream(id)
    setDreams(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dreams
    return dreams.filter(d =>
      stripHtml(d.description).toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [dreams, query])

  const cards = (
    <div className="flex flex-col gap-3">
      {filtered.length === 0 && (
        <p className="font-ui text-white/40 text-sm italic mt-8 text-center">
          {query ? 'Brak wyników.' : 'Brak zapisanych snów.'}
        </p>
      )}
      {filtered.map(dream => {
        const plainText = stripHtml(dream.description)
        return (
          <div
            key={dream.id}
            onClick={() => navigate(`/dream/${dream.id}`)}
            className="w-full text-left rounded-2xl border border-white/15 md:hover:border-white/30 md:hover:-translate-y-0.5 md:hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)] px-5 py-4 transition-all duration-200 active:scale-[0.99] cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="label-caps">{formatDate(dream.createdAt)}</p>
              <button
                type="button"
                onClick={(e) => handleDelete(e, dream.id)}
                disabled={deletingId === dream.id}
                className="w-7 h-7 -mr-[7px] flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all duration-150 active:scale-90 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {plainText ? (
              <p className="font-ui text-white/80 text-sm font-light leading-relaxed line-clamp-3">
                {plainText}
              </p>
            ) : (
              <p className="font-ui text-white/35 text-sm italic">Brak opisu.</p>
            )}
            {dream.tags && dream.tags.length > 0 && (
              <>
                {/* mobile: max 3 tags + ellipsis */}
                <div className="md:hidden flex items-center gap-1.5 mt-3">
                  {dream.tags.slice(0, 3).map(tag => (
                    <span key={tag} className={PILL}>{tag}</span>
                  ))}
                  {dream.tags.length > 3 && <span className={PILL}>. . .</span>}
                </div>
                {/* desktop: as many as fit in one line */}
                <div className="hidden md:block">
                  <TagRowDesktop tags={dream.tags} />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      {/* ── MOBILE layout (< md) ── */}
      <div className="md:hidden min-h-screen flex flex-col max-w-[600px] mx-auto">
        <MobileHeader />

        <div className="px-4 pb-2">
          <button
            onClick={() => navigate(-1)}
            className="font-ui flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors text-sm font-light"
          >
            <ChevronLeft size={18} />
            <span>Wróć</span>
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-4 h-11 rounded-2xl border border-white/15"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Search size={15} className="text-white/35 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj frazy lub motywu"
              className="flex-1 bg-transparent font-ui text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
        </div>

        <div className="px-4 pb-16">
          {cards}
        </div>
      </div>

      {/* ── DESKTOP layout (≥ md) ── */}
      <div className="hidden md:flex min-h-screen justify-center px-8 py-10">
        <div className="w-full max-w-[900px] flex flex-col">
          {/* Back */}
          <div className="pb-3">
            <button
              onClick={() => navigate(-1)}
              className="font-ui flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors text-sm font-light"
            >
              <ChevronLeft size={18} />
              <span>Wróć do dziennika</span>
            </button>
          </div>

          {/* Search */}
          <div className="pb-6">
            <div className="flex items-center gap-2 px-4 h-11 rounded-2xl border border-white/15"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Search size={15} className="text-white/35 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Szukaj frazy lub motywu"
                className="flex-1 bg-transparent font-ui text-sm text-white placeholder-white/30 outline-none"
              />
            </div>
          </div>

          {cards}
        </div>
      </div>
    </>
  )
}
