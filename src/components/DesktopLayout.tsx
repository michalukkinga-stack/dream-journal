import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getDreams, formatDate, storage, stripHtml } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { DreamCard } from '@/components/DreamCard'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

function DesktopSidebar() {
  const [dreams, setDreams] = useState<Dream[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setDreams(getDreams())
  }, [location])

  const userName = storage.get('userName') ?? 'nieznajomy'
  const lastDream = dreams[0]

  const activeId = location.pathname.startsWith('/dream/')
    ? location.pathname.replace('/dream/', '')
    : location.pathname.startsWith('/edit/')
    ? location.pathname.replace('/edit/', '')
    : null

  return (
    <aside
      className="w-[320px] shrink-0 flex flex-col border-r border-white/40"
      style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div className="pt-14 pb-5 px-5 border-b border-white/30">
        <p className="font-display text-[#2d2440] text-2xl leading-snug">
          Cześć {userName},
        </p>
        <p className="font-ui text-[#6b5f80] text-[0.82rem] font-light tracking-wide mt-1">
          {dreams.length === 0
            ? 'żaden sen nie złapany.'
            : dreams.length === 1
            ? 'złapaliśmy już 1 sen.'
            : `złapaliśmy już ${dreams.length} sny.`}
        </p>
        {lastDream && (
          <p className="font-ui text-[#9d90b0] text-[0.7rem] font-light tracking-wide mt-1">
            ostatni zapis {formatDate(lastDream.createdAt)}
          </p>
        )}
      </div>

      {/* Dream list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {dreams.length === 0 ? (
          <p className="font-ui text-[#9d90b0] text-xs font-light text-center py-8 tracking-wide">
            Brak snów. Dodaj pierwszy!
          </p>
        ) : (
          dreams.map((dream) => (
            <button
              key={dream.id}
              onClick={() => navigate(`/dream/${dream.id}`)}
              className={`dream-card w-full text-left transition-all duration-150 ${
                activeId === dream.id
                  ? 'ring-2 ring-purple-400/60 bg-white/70'
                  : ''
              }`}
            >
              <div className="p-4">
                <p className="label-caps mb-2">{formatDate(dream.createdAt)}</p>
                <h2 className="font-display text-[#2d2440] text-lg leading-tight mb-1">
                  {dream.title}
                </h2>
                {stripHtml(dream.description) && (
                  <p className="font-ui text-[#6b5f80] text-[0.75rem] font-light leading-relaxed line-clamp-2">
                    {stripHtml(dream.description)}
                  </p>
                )}
                {dream.tags.length > 0 && (
                  <div className="flex flex-nowrap gap-1 mt-2 overflow-hidden">
                    {dream.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="font-ui px-2 py-0.5 rounded-full text-[0.65rem] font-light whitespace-nowrap
                                   border border-purple-200/60 text-purple-600 bg-purple-100/40"
                      >
                        {tag}
                      </span>
                    ))}
                    {dream.tags.length > 3 && (
                      <span className="font-ui px-2 py-0.5 rounded-full text-[0.65rem] font-medium whitespace-nowrap
                                       border border-purple-300/70 text-purple-700 bg-purple-200/50">
                        +{dream.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Add button */}
      <div className="p-4 border-t border-white/30">
        <button
          onClick={() => navigate('/add')}
          className={`font-ui w-full h-11 rounded-full flex items-center justify-center gap-2
                     text-white text-sm font-medium tracking-wide
                     bg-gradient-to-r from-[#533483] to-[#6a44a0]
                     hover:from-[#6a44a0] hover:to-[#7d55b8]
                     shadow-md shadow-purple-900/30
                     transition-all duration-150 active:scale-[0.98] ${
                       location.pathname === '/add' ? 'ring-2 ring-purple-400/60' : ''
                     }`}
        >
          <Plus size={16} />
          Nowy sen
        </button>
      </div>
    </aside>
  )
}

function DesktopRightPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="mb-6 opacity-30">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <circle cx="36" cy="36" r="18" stroke="#533483" strokeWidth="1.5" />
          <circle cx="36" cy="36" r="10" stroke="#533483" strokeWidth="1.5" />
          <circle cx="36" cy="36" r="2" fill="#533483" />
          {[0,45,90,135,180,225,270,315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const x1 = 36 + 18 * Math.cos(rad)
            const y1 = 36 + 18 * Math.sin(rad)
            const x2 = 36 + 28 * Math.cos(rad)
            const y2 = 36 + 28 * Math.sin(rad)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#533483" strokeWidth="1.5" strokeLinecap="round" />
          })}
        </svg>
      </div>
      <p className="font-display text-[#2d2440] text-2xl mb-2">Wybierz sen</p>
      <p className="font-ui text-[#9d90b0] text-sm font-light tracking-wide">
        lub dodaj nowy ze listy po lewej
      </p>
    </div>
  )
}

export function DesktopLayout() {
  const isDesktop = useIsDesktop()
  const location = useLocation()

  if (!isDesktop) {
    return <Outlet />
  }

  const showPlaceholder = location.pathname === '/home'

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar />
      <main className="flex-1 overflow-y-auto">
        {showPlaceholder ? <DesktopRightPlaceholder /> : <Outlet />}
      </main>
    </div>
  )
}
