import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function MobileHeader() {
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
    <div className="flex items-center justify-between pt-10 px-4 pb-1">
      <p className="font-display text-white text-xl">Dziennik Snów</p>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 ${
            open ? 'text-white bg-white/15' : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <MoreVertical size={20} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-11 z-50 rounded-2xl border border-white/15 py-1 min-w-[180px]"
            style={{ background: '#1f2937', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          >
            <Link
              to="/dreams"
              onClick={() => setOpen(false)}
              className="font-ui flex items-center px-4 h-11 text-sm text-violet-400 hover:text-violet-300 hover:bg-white/8 transition-colors whitespace-nowrap"
            >
              Przeglądaj wszystkie wpisy
            </Link>
            <Link
              to="/api-docs"
              onClick={() => setOpen(false)}
              className="font-ui flex items-center px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
            >
              API Docs
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="font-ui flex items-center px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
            >
              Ustawienia
            </Link>
            <div className="mx-4 h-px bg-white/10" />
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="font-ui w-full flex items-center px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
            >
              Wylogowanie
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
