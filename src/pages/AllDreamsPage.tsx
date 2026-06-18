import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, Trash2 } from 'lucide-react'
import { getDreams, formatDate, deleteDream } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { MobileHeader } from '@/components/MobileHeader'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const PILL = 'font-ui px-3 h-6 flex items-center rounded-full text-xs font-light shrink-0 border border-violet-400/50 bg-violet-400/15 text-violet-300'
const GAP = 6

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
      <div ref={measureRef} className="absolute invisible flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
        {tags.map(tag => <span key={tag} className={PILL}>{tag}</span>)}
        <span className={PILL}>. . .</span>
      </div>
      <div ref={containerRef} className="flex items-center gap-1.5 overflow-hidden">
        {tags.slice(0, visibleCount).map(tag => (
          <span key={tag} className={PILL}>{tag}</span>
        ))}
        {showEllipsis && <span className={PILL}>. . .</span>}
      </div>
    </div>
  )
}

const SAMPLE_DREAMS: Dream[] = [
  {
    id: '__sample_1',
    title: '',
    description: '<p>Leciałam nad miastem, które wyglądało jak moja rodzinna miejscowość, ale wszystkie budynki były odwrócone do góry nogami. Czułam się lekko i wolna.</p>',
    tags: ['latanie', 'miasto', 'wolność'],
    photoUrls: [],
    createdAt: '2026-06-15T22:14:00Z',
  },
  {
    id: '__sample_2',
    title: '',
    description: '<p>Byłam w ogromnym lesie z drzewami świecącymi na niebiesko. Spotkałam lisę, która mówiła ludzkim głosem i pokazała mi drogę do ukrytej polany.</p>',
    tags: ['las', 'zwierzęta', 'magia'],
    photoUrls: [],
    createdAt: '2026-06-13T23:42:00Z',
  },
  {
    id: '__sample_3',
    title: '',
    description: '<p>Śniłam o egzaminie, na który zapomniałam się przygotować. Sala była pusta, tylko profesor siedział przy biurku i pisał coś bez przerwy.</p>',
    tags: ['egzamin', 'stres', 'szkoła'],
    photoUrls: [],
    createdAt: '2026-06-11T07:08:00Z',
  },
  {
    id: '__sample_4',
    title: '',
    description: '<p>Latałam nad oceanem podczas burzy. Błyskawice oświetlały fale pode mną, ale czułam się bezpiecznie wysoko nad chmurami.</p>',
    tags: ['latanie', 'ocean', 'burza'],
    photoUrls: [],
    createdAt: '2026-06-09T01:30:00Z',
  },
  {
    id: '__sample_5',
    title: '',
    description: '<p>Wróciłam do domu z dzieciństwa, ale wszystkie pokoje były inne. W piwnicy znalazłam drzwi, których nigdy wcześniej nie widziałam.</p>',
    tags: ['dom', 'dzieciństwo', 'tajemnica'],
    photoUrls: [],
    createdAt: '2026-06-07T06:55:00Z',
  },
]

type Tab = 'dreams' | 'themes'

export function AllDreamsPage() {
  const navigate = useNavigate()
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('dreams')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [tagQuery, setTagQuery] = useState('')

  useEffect(() => {
    getDreams().then(data => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setDreams(sorted)
      setLoaded(true)
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

  const displayDreams = dreams
  const isSample = false

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const dream of displayDreams) {
      for (const tag of dream.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [displayDreams])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return displayDreams
    return displayDreams.filter(d =>
      stripHtml(d.description).toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [displayDreams, query])

  function TabBar({ className }: { className?: string }) {
    return (
      <div className={`flex gap-1 ${className ?? ''}`}>
        {(['dreams', 'themes'] as Tab[]).map(tab => {
          const label = tab === 'dreams' ? 'Wszystkie sny' : 'Wszystkie motywy'
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedTag(null) }}
              className={`font-ui px-4 py-2 rounded-xl text-sm font-light transition-all duration-150 ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/45 active:text-white/70 active:bg-white/5'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  const dreamCards = (
    <div className="flex flex-col gap-3">
      {loaded && dreams.length === 0 && !query && (
        <p className="font-ui text-white/40 text-sm text-center mt-10 px-4">
          Dodaj pierwszy wpis,<br />aby przeglądać listę wszystkich snów.
        </p>
      )}
      {filtered.length === 0 && query && (
        <p className="font-ui text-white/40 text-sm italic mt-8 text-center">Brak wyników.</p>
      )}
      {filtered.map(dream => {
        const plainText = stripHtml(dream.description)
        const isSampleEntry = dream.id.startsWith('__sample')
        return (
          <div
            key={dream.id}
            onClick={() => navigate(`/dream/${dream.id}`)}
            className="w-full text-left rounded-2xl border border-white/15 px-5 py-4 transition-all duration-200 md:hover:border-white/30 md:hover:-translate-y-0.5 md:hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)] active:scale-[0.99] cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="label-caps">{formatDate(dream.createdAt)}</p>
              {!isSampleEntry && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, dream.id)}
                  disabled={deletingId === dream.id}
                  className="w-7 h-7 -mr-[7px] flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all duration-150 active:scale-90 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              )}
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
                <div className="md:hidden flex items-center gap-1.5 mt-3">
                  {dream.tags.slice(0, 3).map(tag => (
                    <span key={tag} className={PILL}>{tag}</span>
                  ))}
                  {dream.tags.length > 3 && <span className={PILL}>. . .</span>}
                </div>
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

  const tagDreams = selectedTag
    ? displayDreams.filter(d => d.tags.includes(selectedTag))
    : []

  const themesList = selectedTag ? (
    <div className="flex flex-col">
      <button
        onClick={() => setSelectedTag(null)}
        className="font-ui flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors text-sm font-light mb-5 self-start"
      >
        <ChevronLeft size={18} />
        <span>Wszystkie motywy</span>
      </button>
      <div className="flex items-center gap-2 mb-6">
        <span className={PILL}>{selectedTag}</span>
        <span className="font-ui text-white/35 text-sm font-light">
          {tagDreams.length} {tagDreams.length === 1 ? 'sen' : tagDreams.length < 5 ? 'sny' : 'snów'}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {tagDreams.map(dream => {
          const plainText = stripHtml(dream.description)
          const isSampleEntry = dream.id.startsWith('__sample')
          return (
            <div
              key={dream.id}
              onClick={() => !isSampleEntry && navigate(`/dream/${dream.id}`)}
              className={`w-full text-left rounded-2xl border border-white/15 px-5 py-4 transition-all duration-200 ${
                isSampleEntry
                  ? 'opacity-60 cursor-default'
                  : 'md:hover:border-white/30 md:hover:-translate-y-0.5 md:hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)] active:scale-[0.99] cursor-pointer'
              }`}
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="label-caps">{formatDate(dream.createdAt)}</p>
              </div>
              {plainText ? (
                <p className="font-ui text-white/80 text-sm font-light leading-relaxed line-clamp-3">{plainText}</p>
              ) : (
                <p className="font-ui text-white/35 text-sm italic">Brak opisu.</p>
              )}
              {dream.tags && dream.tags.length > 0 && (
                <>
                  <div className="md:hidden flex items-center gap-1.5 mt-3">
                    {dream.tags.slice(0, 3).map(tag => (
                      <span key={tag} className={PILL}>{tag}</span>
                    ))}
                    {dream.tags.length > 3 && <span className={PILL}>. . .</span>}
                  </div>
                  <div className="hidden md:block">
                    <TagRowDesktop tags={dream.tags} />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-0">
      {tagCounts.filter(([tag]) => tag.toLowerCase().includes(tagQuery.trim().toLowerCase())).length === 0 && (
        <p className="font-ui text-white/40 text-sm text-center mt-10 px-4">
          Gdy dodasz pierwszy motyw do snu,<br />pojawi się na liście.
        </p>
      )}
      {tagCounts.filter(([tag]) => tag.toLowerCase().includes(tagQuery.trim().toLowerCase())).map(([tag, count]) => (
        <button
          key={tag}
          onClick={() => setSelectedTag(tag)}
          className="flex items-center justify-between py-3.5 border-b border-white/8 rounded-xl px-2 -mx-2 transition-all duration-150 md:hover:bg-white/6 active:bg-white/8 active:scale-[0.99] cursor-pointer group"
        >
          <span className={`${PILL} group-hover:border-violet-400/70 group-hover:bg-violet-400/20 transition-all duration-150`}>{tag}</span>
          <span
            className="font-ui text-sm text-white/35 font-light tabular-nums group-hover:text-white/60 transition-colors"
          >
            {count} {count === 1 ? 'sen' : count < 5 ? 'sny' : 'snów'}
          </span>
        </button>
      ))}
    </div>
  )

  return (
    <>
      {/* ── MOBILE layout (< md) ── */}
      <div className="md:hidden min-h-screen flex flex-col max-w-[600px] mx-auto">
        <MobileHeader />

        <div className="px-4 pb-2">
          <button
            onClick={() => navigate('/')}
            className="font-ui flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors text-sm font-light"
          >
            <ChevronLeft size={18} />
            <span>Wróć</span>
          </button>
        </div>

        <div className="px-4 pb-3">
          <TabBar />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-4 h-11 rounded-2xl border border-white/15"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Search size={15} className="text-white/35 shrink-0" />
            <input
              type="text"
              value={activeTab === 'dreams' ? query : tagQuery}
              onChange={e => activeTab === 'dreams' ? setQuery(e.target.value) : setTagQuery(e.target.value)}
              placeholder={activeTab === 'dreams' ? 'Szukaj frazy lub motywu' : 'Szukaj motywu'}
              className="flex-1 bg-transparent font-ui text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
        </div>

        {activeTab === 'dreams' && (
          <div className="px-4 pb-16">
            {dreamCards}
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="px-4 pb-16">
            {themesList}
          </div>
        )}
      </div>

      {/* ── DESKTOP layout (≥ md) ── */}
      <div className="hidden md:flex min-h-screen justify-center px-8 py-10">
        <div className="w-full max-w-[900px] flex flex-col">
          {!selectedTag && (
            <div className="pb-3">
              <button
                onClick={() => navigate('/')}
                className="font-ui flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors text-sm font-light"
              >
                <ChevronLeft size={18} />
                <span>Wróć do dziennika</span>
              </button>
            </div>
          )}

          <div className="pb-5">
            <TabBar />
          </div>

          {activeTab === 'dreams' && (
            <>
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
              {dreamCards}
            </>
          )}

          {activeTab === 'themes' && themesList}
        </div>
      </div>
    </>
  )
}
