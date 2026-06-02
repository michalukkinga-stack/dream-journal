import { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import Highlighter from 'react-highlight-words'
import { DREAM_TAGS } from '@/constants/tags'

interface TagPickerProps {
  selected: string[]
  onChange: (tags: string[]) => void
  onClose: () => void
}

export function TagPicker({ selected, onChange, onClose }: TagPickerProps) {
  const [desktopSelected, setDesktopSelected] = useState(selected)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function toggleMobile(tag: string) {
    setDesktopSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function handleMobileSave() {
    onChange(desktopSelected)
    onClose()
  }

  function toggleDesktop(tag: string) {
    setDesktopSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function handleDesktopSave() {
    onChange(desktopSelected)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* ── MOBILE bottom sheet ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50
                   rounded-t-3xl border-t border-white/10 animate-slide-up
                   flex flex-col max-h-[67vh]"
        style={{
          background: 'radial-gradient(ellipse 100% 60% at 50% 60%, rgba(202, 196, 238, 0.18) 0%, transparent 70%), linear-gradient(170deg, #3D4254 0%, #7A465B 50%, #16323F 100%)',
          backgroundAttachment: 'fixed',
          backdropFilter: 'blur(20px)',
        }}
      >
        <SheetContent selected={desktopSelected} onClose={onClose} toggle={toggleMobile} onSave={handleMobileSave} fullWidth />
      </div>

      {/* ── DESKTOP centered dialog ── */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
        <div
          className="relative w-full max-w-[900px] rounded-2xl shadow-xl flex flex-col max-h-[72vh]"
          style={{
            background: 'radial-gradient(ellipse 100% 60% at 50% 60%, rgba(202, 196, 238, 0.18) 0%, transparent 70%), linear-gradient(170deg, #3D4254 0%, #7A465B 50%, #16323F 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetContent
            selected={desktopSelected}
            onClose={onClose}
            toggle={toggleDesktop}
            onSave={handleDesktopSave}
          />
        </div>
      </div>
    </>
  )
}

function SheetContent({
  selected,
  onClose,
  toggle,
  onSave,
  fullWidth = false,
}: {
  selected: string[]
  onClose: () => void
  toggle: (tag: string) => void
  onSave?: () => void
  fullWidth?: boolean
}) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? DREAM_TAGS.filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
    : DREAM_TAGS

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header: wyszukiwarka + X */}
      <div className="shrink-0 pl-5 pr-14 pt-5 pb-3 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10
                     flex items-center justify-center z-10
                     text-white/60 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj motywu..."
            autoFocus
            className="font-ui w-full h-10 pl-9 pr-9 rounded-full
                       bg-white/10 border border-white/18
                       text-white placeholder:text-white/35 text-sm font-light tracking-wide
                       focus:outline-none focus:border-white/35 focus:ring-1 focus:ring-white/15
                       transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         w-5 h-5 rounded-full bg-white/15 hover:bg-white/25
                         flex items-center justify-center transition-colors"
            >
              <X size={11} className="text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* Tagi */}
      <div className="flex-1 min-h-0 relative">
        <div className={`h-full overflow-y-auto px-5 ${onSave ? 'pb-24' : 'pb-5'}`}>
          {filtered.length === 0 ? (
            <p className="font-ui text-white/50 text-sm font-light text-center py-8 tracking-wide">
              Brak pasujących motywów
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filtered.map(tag => {
                const isSelected = selected.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggle(tag)}
                    className={[
                      'px-4 h-7 rounded-full text-sm font-ui tracking-wide',
                      'border transition-all duration-150 active:scale-95',
                      isSelected
                        ? 'border-2 border-[#6a44a0] text-[#6a44a0] bg-white/90 font-medium'
                        : 'border-[#2a1a4a]/50 text-[#2a1a4a] bg-white/60 font-light hover:bg-white/80',
                    ].join(' ')}
                  >
                    <Highlighter
                      searchWords={[query]}
                      autoEscape
                      textToHighlight={tag}
                      highlightClassName="bg-transparent font-semibold text-white not-italic"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {onSave && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-10 px-5 pb-5 ${fullWidth ? '' : 'flex justify-end'}`}
            style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 60%, rgba(202, 196, 238, 0.18) 0%, transparent 70%), linear-gradient(170deg, #3D4254 0%, #7A465B 50%, #16323F 100%)' }}
          >
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, #16323F)', top: '-60px' }}
            />
            <button
              onClick={onSave}
              className={`relative font-ui h-14 rounded-full
                         bg-gradient-to-r from-[#533483] to-[#6a44a0]
                         text-white font-medium text-[0.95rem] tracking-wide
                         shadow-lg shadow-purple-900/50
                         hover:from-[#6a44a0] hover:to-[#7d55b8]
                         active:scale-[0.98] transition-all duration-150
                         ${fullWidth ? 'w-full' : 'px-8'}`}
            >
              Zapisz
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
