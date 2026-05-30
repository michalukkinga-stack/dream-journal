import { useEffect, useState } from 'react'
import { getDreams, formatDate } from '@/storage/dreamStorage'
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
      {/* Header */}
      <div className="pt-14 pb-6 px-5">
        <p className="font-display text-[#2d2440] text-3xl leading-snug">
          Cześć {localStorage.getItem('userName') ?? 'nieznajomy'},
        </p>
        <p className="font-ui text-[#6b5f80] text-[0.95rem] font-light tracking-wide mt-1">
          {dreams.length === 1
            ? 'razem złapaliśmy już 1 sen.'
            : `razem złapaliśmy już ${dreams.length} sny.`}
        </p>
        {lastDream && (
          <p className="font-ui text-[#9d90b0] text-xs font-light tracking-wide mt-2">
            ostatni zapis {formatDate(lastDream.createdAt)}
          </p>
        )}
      </div>

      {/* Lista snów */}
      <div className="flex-1 px-5 pb-36 space-y-3">
        {dreams.length === 0 ? (
          <div className="text-center py-16 text-[#94a3b8]">
            <p className="text-4xl mb-4">🌙</p>
            <p className="text-base">Twoja noc jest jeszcze pusta.</p>
            <p className="text-sm mt-1 opacity-70">Dodaj pierwszy sen.</p>
          </div>
        ) : (
          dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} />
          ))
        )}
      </div>

      <FAB />
    </div>
  )
}
