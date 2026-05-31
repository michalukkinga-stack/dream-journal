import { useEffect, useState } from 'react'
import { getDreams, formatDate, storage } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { DreamCard } from '@/components/DreamCard'
import { FAB } from '@/components/FAB'

export function HomePage() {
  const [dreams, setDreams] = useState<Dream[]>([])

  useEffect(() => {
    setDreams(getDreams())
  }, [])

  useEffect(() => {
    const onFocus = () => setDreams(getDreams())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const lastDream = dreams[0]

  return (
    <div className="min-h-screen flex flex-col">
      {dreams.length > 0 && (
        <div className="pt-14 pb-6 px-5">
          <p className="font-display text-white text-3xl leading-snug pr-12">
            Cześć {storage.get('userName') ?? 'nieznajomy'},
          </p>
          <p className="font-ui text-white/90 text-[0.95rem] font-light tracking-wide mt-1">
            {dreams.length === 1
              ? 'razem złapaliśmy już 1 sen.'
              : `razem złapaliśmy już ${dreams.length} sny.`}
          </p>
          {lastDream && (
            <p className="font-ui text-white/70 text-xs font-light tracking-wide mt-2">
              ostatni zapis {formatDate(lastDream.createdAt)}
            </p>
          )}
        </div>
      )}

      {dreams.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-8 pb-36">
          <p className="font-ui text-white/90 text-[1.05rem] font-light text-center leading-relaxed tracking-wide">
            Cześć {storage.get('userName') ?? 'nieznajomy'}! Sny szybko uciekają.<br />Złap pierwszy, który pamiętasz.
          </p>
        </div>
      ) : (
        <div className="flex-1 px-5 pb-36 space-y-3">
          {dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} />
          ))}
        </div>
      )}

      <FAB label={dreams.length === 0 ? 'Złapmy pierwszy sen' : 'Złapmy następny!'} />
    </div>
  )
}
