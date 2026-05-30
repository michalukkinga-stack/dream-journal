import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { getDreams, formatDate } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { DreamCard } from '@/components/DreamCard'
import { FAB } from '@/components/FAB'

export function HomePage() {
  const [dreams, setDreams] = useState<Dream[]>([])
  const navigate = useNavigate()

  function handleChangeUser() {
    localStorage.removeItem('userName')
    navigate('/', { replace: true })
  }

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
      {/* Header — tylko gdy są sny */}
      {dreams.length > 0 && (
        <div className="pt-14 pb-6 px-5 relative">
          <button
            onClick={handleChangeUser}
            className="absolute top-14 right-5 w-9 h-9 rounded-full
                       bg-white/60 backdrop-blur-sm border border-purple-200/60
                       flex items-center justify-center
                       text-[#6b5f80] hover:text-[#2d2440] hover:bg-white/80
                       transition-all duration-150 active:scale-95"
            title="Zmień imię"
          >
            <UserRound size={16} />
          </button>
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
      )}

      {/* Lista snów / Empty state */}
      {dreams.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-8 pb-36">
          <p className="font-ui text-[#6b5f80] text-[1.05rem] font-light text-center leading-relaxed tracking-wide">
            Cześć {localStorage.getItem('userName') ?? 'nieznajomy'},<br />
            żaden sen nie został jeszcze złapany.
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
