import { useEffect, useState } from 'react'
import { getDreams } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { DreamCard } from '@/components/DreamCard'
import { FAB } from '@/components/FAB'
import { MoonIcon } from '@/components/MoonIcon'
import { useAuth } from '@/context/AuthContext'

export function HomePage() {
  const { user, signOut } = useAuth()
  const [dreams, setDreams] = useState<Dream[]>([])

  async function load() {
    setDreams(await getDreams())
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const displayName = user?.email?.split('@')[0] ?? 'nieznajomy'

  return (
    <div className="min-h-screen flex flex-col">
      {dreams.length > 0 && (
        <div className="pt-14 pb-6 px-5 flex items-start justify-between">
          <div>
            <p className="font-display text-white text-3xl leading-snug pr-12">
              Cześć {displayName},
            </p>
            <p className="font-ui text-white/90 text-[0.95rem] font-light tracking-wide mt-1">
              {dreams.length === 1
                ? 'Razem złapaliśmy już 1 sen.'
                : `Razem złapaliśmy już ${dreams.length} sny.`}
            </p>
          </div>
          <button
            onClick={signOut}
            className="font-ui text-white/40 hover:text-white/70 text-xs mt-1 transition-colors"
          >
            Wyloguj
          </button>
        </div>
      )}

      {dreams.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-36 gap-6">
          <p className="font-ui text-white/90 text-[1.05rem] font-light text-center leading-relaxed tracking-wide">
            Cześć {displayName}!<br />Zapisz pierwszy sen, zanim ucieknie!
          </p>
          <MoonIcon className="w-40 h-40" />
          <button
            onClick={signOut}
            className="font-ui text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            Wyloguj
          </button>
        </div>
      ) : (
        <div className="flex-1 px-5 pb-36 space-y-3">
          {dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} />
          ))}
        </div>
      )}

      <FAB label="Zapisz nowy sen" />
    </div>
  )
}
