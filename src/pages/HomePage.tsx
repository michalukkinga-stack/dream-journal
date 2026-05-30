import { useEffect, useState } from 'react'
import { getDreams } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { DreamCard } from '@/components/DreamCard'
import { FAB } from '@/components/FAB'

export function HomePage() {
  const [dreams, setDreams] = useState<Dream[]>([])

  useEffect(() => {
    setDreams(getDreams())
  }, [])

  // Odśwież listę gdy wracamy na tę stronę (np. po dodaniu snu)
  useEffect(() => {
    const onFocus = () => setDreams(getDreams())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-6 px-5">
        <h1 className="font-display text-[#2d2440] text-4xl mb-1">
          Łapacz snów
        </h1>
        <p className="font-ui text-[#6b5f80] text-[0.95rem] font-light mt-1 tracking-wide">
          Cześć {localStorage.getItem('userName') ?? 'nieznajomy'},
        </p>
        <p className="font-ui text-[#6b5f80] text-[0.95rem] font-light tracking-wide">
          {dreams.length === 1
            ? 'Razem złapaliśmy już 1 sen.'
            : `Razem złapaliśmy już ${dreams.length} sny.`}
        </p>
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
