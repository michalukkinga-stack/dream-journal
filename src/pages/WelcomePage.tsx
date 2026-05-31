import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { storage } from '@/storage/dreamStorage'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils'
import { MoonIcon } from '@/components/MoonIcon'

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
          Dziennik snów
        </h1>
        <p className="font-ui text-white/65 text-base font-light">
          Miejsce na sny, które warto zapamiętać.
        </p>
      </div>

      {/* Ikona łapacza snów — centrum ekranu */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-2">
        <MoonIcon className="w-auto h-full max-h-[380px]" />
      </div>

      {/* Pole na imię */}
      <div className="px-8 pb-4 shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Twoje imię"
            value={mic.isListening ? (name ? name + ' ' : '') + (mic.interim || '') : name}
            onChange={(e) => { if (!mic.isListening) setName(e.target.value) }}
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
                  ? 'bg-green-500/20 text-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.35)] animate-pulse'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/10'
              )}
            >
              <Mic size={14} />
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
