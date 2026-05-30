import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getDreams, formatDate, storage, stripHtml } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { AddDreamPage } from '@/pages/AddDreamPage'

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

function DesktopSidebar({ dreams }: { dreams: Dream[] }) {
  const navigate = useNavigate()
  const location = useLocation()

  const userName = storage.get('userName') ?? 'nieznajomy'
  const lastDream = dreams[0]

  const activeId = location.pathname.startsWith('/dream/')
    ? location.pathname.replace('/dream/', '')
    : location.pathname.startsWith('/edit/')
    ? location.pathname.replace('/edit/', '')
    : null

  return (
    <aside
      className="w-[320px] shrink-0 flex flex-col border-r border-white/10"
      style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)' }}
    >
      {/* Dream list */}
      <div className="flex-1 overflow-y-auto px-3 pt-5 pb-3 space-y-2">
        {dreams.length === 0 ? (
          <p className="font-ui text-white/75 text-xs font-light text-center py-8 tracking-wide">
            Brak snów. Dodaj pierwszy!
          </p>
        ) : (
          dreams.map((dream) => (
            <button
              key={dream.id}
              onClick={() => navigate(`/dream/${dream.id}`)}
              className={`dream-card w-full text-left transition-all duration-150 ${
                activeId === dream.id
                  ? 'ring-2 ring-purple-400/50 !bg-white/15'
                  : ''
              }`}
            >
              <div className="p-4">
                <p className="label-caps mb-2">{formatDate(dream.createdAt)}</p>
                <h2 className="font-display text-white text-lg leading-tight mb-1">
                  {dream.title}
                </h2>
                {stripHtml(dream.description) && (
                  <p className="font-ui text-white/85 text-[0.75rem] font-light leading-relaxed line-clamp-2">
                    {stripHtml(dream.description)}
                  </p>
                )}
                {dream.tags.length > 0 && (
                  <div className="flex flex-nowrap gap-1 mt-2 overflow-hidden">
                    {dream.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="font-ui px-2 py-0.5 rounded-full text-[0.65rem] font-light whitespace-nowrap
                                   border border-white/25 text-white/90 bg-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                    {dream.tags.length > 3 && (
                      <span className="font-ui px-2 py-0.5 rounded-full text-[0.65rem] font-medium whitespace-nowrap
                                       border border-white/25 text-white/90 bg-white/10">
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
    </aside>
  )
}

export function DesktopLayout() {
  const isDesktop = useIsDesktop()
  const location = useLocation()
  const [dreams, setDreams] = useState<Dream[]>(() => getDreams())
  const [formKey, setFormKey] = useState(0)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    setDreams(getDreams())
  }, [location, formKey])

  function handleSaved() {
    setDreams(getDreams())
    setShowSaved(true)
    setFormKey(k => k + 1)
    setTimeout(() => setShowSaved(false), 3000)
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen flex flex-col items-center">
        <div className="w-full max-w-[480px]">
          <Outlet />
        </div>
      </div>
    )
  }

  const showAddForm = location.pathname === '/home' || location.pathname === '/add'

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex h-full w-full">
        <DesktopSidebar dreams={dreams} />
        <main className="flex-1 overflow-y-auto relative">
          {showSaved && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                            px-10 py-5 rounded-full
                            bg-white/20 backdrop-blur-sm text-white font-ui text-[1.75rem] font-medium tracking-wide
                            border border-white/30 shadow-lg
                            animate-fade-in">
              Zapisano ✓
            </div>
          )}
          {showAddForm
            ? <AddDreamPage key={formKey} desktopMode onSaved={handleSaved} />
            : <Outlet />
          }
        </main>
      </div>
    </div>
  )
}
