import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '@/storage/dreamStorage'

export function WelcomePage() {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (storage.get('userName')) {
      navigate('/home', { replace: true })
    }
  }, [])

  function handleStart() {
    const trimmed = name.trim()
    if (!trimmed) return
    storage.set('userName', trimmed)
    navigate('/home')
  }

  return (
    <div className="h-dvh flex flex-col items-center overflow-hidden">
    <div className="w-full max-w-[480px] flex flex-col h-full">

      {/* Tytuł i podtytuł */}
      <div className="pt-12 px-8 text-center shrink-0">
        <h1 className="font-display text-white text-4xl mb-3">
          Łapacz snów
        </h1>
        <p className="font-ui text-white/65 text-base font-light">
          Miejsce na sny, które warto zapamiętać.
        </p>
      </div>

      {/* Ikona łapacza snów — centrum ekranu */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-2">
        <MoonIcon />
      </div>

      {/* Pole na imię */}
      <div className="px-8 pb-4 shrink-0">
        <input
          type="text"
          placeholder="Twoje imię"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          className="w-full border border-white/20 rounded-xl px-4 py-3 font-ui text-white placeholder:text-white/35 bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/25"
        />
      </div>

      {/* Baton — pełna szerokość, przyklejony do dołu */}
      <div className="p-4 pb-8 shrink-0">
        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className="w-full h-14 rounded-full
                     bg-gradient-to-r from-[#533483] to-[#6a44a0]
                     text-white font-ui font-medium text-[0.95rem] tracking-wide
                     flex items-center justify-center
                     shadow-lg shadow-purple-900/50
                     hover:from-[#6a44a0] hover:to-[#7d55b8]
                     active:scale-[0.98] transition-all duration-150
                     disabled:opacity-40"
        >
          Zaczynajmy!
        </button>
      </div>
    </div>
    </div>
  )
}

/* ── Ikona księżyca (sierp) ─────────────────────────────────── */

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-label="Księżyc"
      className="w-auto h-full max-h-[380px]"
      style={{ filter: 'drop-shadow(0 4px 24px rgba(100,70,160,0.18))', opacity: 0.5 }}
    >
      <defs>
        <mask id="moon-mask">
          <rect width="200" height="200" fill="white" />
          <circle cx="66" cy="100" r="72" fill="black" />
        </mask>
      </defs>
      <circle cx="100" cy="100" r="80" fill="white" mask="url(#moon-mask)" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="1.7" />
    </svg>
  )
}
