import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, UserRound } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { MoonIcon } from '@/components/MoonIcon'

interface MobileHeaderProps {
  onPickTherapist?: () => void
}

export function MobileHeader({ onPickTherapist }: MobileHeaderProps) {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="flex items-center justify-between pt-10 px-4 pb-0">
      <div className="flex items-center gap-2">
        <MoonIcon className="w-6 h-6" />
        <p className="font-display text-white text-xl">Dziennik Snów</p>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 ${
            open ? 'text-white bg-white/15' : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <Menu size={20} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-11 z-50 rounded-2xl border border-white/15 py-1 min-w-[210px]"
            style={{ background: '#1f2937', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          >
            <Link
              to="/dreams"
              onClick={() => setOpen(false)}
              className="font-ui flex items-center gap-3 px-4 h-11 text-sm text-violet-400 hover:text-violet-300 hover:bg-white/8 transition-colors whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              Wszystkie wpisy
            </Link>
            <button
              onClick={() => { setOpen(false); onPickTherapist?.() }}
              className="font-ui w-full flex items-center gap-3 px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
            >
              <UserRound size={15} />
              Wybierz terapeutę
            </button>
            <Link
              to="/api-docs"
              onClick={() => setOpen(false)}
              className="font-ui flex items-center gap-3 px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Dokumentacja
            </Link>
            <div className="mx-4 h-px bg-white/10" />
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="font-ui w-full flex items-center gap-3 px-4 h-11 text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Wyloguj się
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
