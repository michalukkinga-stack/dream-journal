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
        <p className="text-[#94a3b8] text-sm font-light tracking-widest uppercase mb-1">
          Dziennik snów
        </p>
        <h1 className="text-[#e2d4b7] text-3xl font-semibold leading-tight">
          Cześć Kinga,
        </h1>
        <p className="text-[#94a3b8] text-base mt-1">
          Oto lista Twoich snów:
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
