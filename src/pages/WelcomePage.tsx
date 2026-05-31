import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff } from 'lucide-react'
import { storage } from '@/storage/dreamStorage'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils'

export function WelcomePage() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const mic = useSpeechRecognition()

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
        <div className="relative">
          <input
            type="text"
            placeholder="Twoje imię"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            className={cn(
              'w-full border border-white/20 rounded-xl px-4 py-3 font-ui text-white placeholder:text-white/35 bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/25',
              mic.isSupported && 'pr-12'
            )}
          />
          {mic.isSupported && (
            <button
              type="button"
              onClick={() => {
                if (mic.isListening) {
                  mic.stop()
                } else {
                  mic.start((text) => setName(text))
                }
              }}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95',
                mic.isListening
                  ? 'bg-red-500/25 text-red-300'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/10'
              )}
            >
              {mic.isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
        </div>
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

/* Pomocnicza gwiazdka 4-ramienna (sparkle) */
function Sparkle({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const i = r * 0.18 // szerokość talii
  return (
    <path
      d={`M ${cx} ${cy - r}
          L ${cx + i} ${cy - i}
          L ${cx + r} ${cy}
          L ${cx + i} ${cy + i}
          L ${cx} ${cy + r}
          L ${cx - i} ${cy + i}
          L ${cx - r} ${cy}
          L ${cx - i} ${cy - i}
          Z`}
      fill="white"
    />
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-label="Księżyc"
      className="w-auto h-full max-h-[380px]"
      style={{ filter: 'drop-shadow(0 4px 24px rgba(100,70,160,0.18))' }}
    >
      <defs>
        <mask id="moon-mask">
          <rect width="200" height="200" fill="white" />
          <circle cx="66" cy="100" r="72" fill="black" />
        </mask>
      </defs>

      {/* Sierp księżyca — półprzezroczysty */}
      <g opacity="0.5">
        <circle cx="100" cy="100" r="80" fill="white" mask="url(#moon-mask)" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="1.7" />
      </g>

      {/* Gwiazdki — pełna widoczność, większe */}
      <g opacity="0.92">
        <Sparkle cx={148} cy={93}  r={18} />
        <Sparkle cx={126} cy={62}  r={10} />
        <Sparkle cx={164} cy={128} r={7}  />
      </g>
    </svg>
  )
}
