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
        <NightSphereIcon />
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

/* ── Ikona księżyca ─────────────────────────────────────────── */

function sp(cx: number, cy: number, r: number) {
  const s = r * 0.28
  return `M${cx},${cy-r} C${cx+s},${cy-s} ${cx+s},${cy-s} ${cx+r},${cy} C${cx+s},${cy+s} ${cx+s},${cy+s} ${cx},${cy+r} C${cx-s},${cy+s} ${cx-s},${cy+s} ${cx-r},${cy} C${cx-s},${cy-s} ${cx-s},${cy-s} ${cx},${cy-r} Z`
}

function dot(cx: number, cy: number, r: number) {
  return `M${cx-r},${cy} a${r},${r} 0 1,0 ${2*r},0 a${r},${r} 0 1,0 ${-2*r},0 Z`
}

function NightSphereIcon() {
  // Iskierki dookoła koła (pełny okrąg, równomiernie + kilka dodatkowych)
  const outer = [
    { cx: 100, cy: -12, r: 5   },
    { cx: 155, cy: 5,   r: 3.5 },
    { cx: 196, cy: 52,  r: 4.5 },
    { cx: 210, cy: 100, r: 6   },
    { cx: 196, cy: 150, r: 4   },
    { cx: 158, cy: 196, r: 5   },
    { cx: 100, cy: 212, r: 3.5 },
    { cx: 44,  cy: 196, r: 4.5 },
    { cx: 4,   cy: 150, r: 3.5 },
    { cx: -10, cy: 100, r: 5   },
    { cx: 4,   cy: 50,  r: 4   },
    { cx: 44,  cy: 6,   r: 3.5 },
  ]

  return (
    <svg
      viewBox="-24 -24 248 248"
      aria-label="Nocne niebo"
      className="w-auto h-full max-h-[220px]"
      style={{ filter: 'drop-shadow(0 4px 24px rgba(100,70,160,0.25))', opacity: 0.5 }}
    >
      {/* Pełne białe koło */}
      <circle cx="100" cy="100" r="90" fill="white" />

      {/* Białe iskierki dookoła */}
      {outer.map(({ cx, cy, r }, i) => (
        <path key={i} d={sp(cx, cy, r)} fill="white" />
      ))}
    </svg>
  )
}
