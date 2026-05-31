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
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag))
    } else {
      onChange([...selected, tag])
    }
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
          background: '#3D4254',
          backdropFilter: 'blur(20px)',
        }}
      >
        <SheetContent selected={selected} onClose={onClose} toggle={toggle} />
      </div>

      {/* ── DESKTOP centered dialog ── */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
        <div
          className="relative w-full max-w-[900px] rounded-2xl shadow-xl flex flex-col max-h-[72vh]"
          style={{
            background: '#3D4254',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetContent selected={selected} onClose={onClose} toggle={toggle} />
        </div>
      </div>
    </>
  )
}

function SheetContent({
  selected,
  onClose,
  toggle,
}: {
  selected: string[]
  onClose: () => void
  toggle: (tag: string) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? DREAM_TAGS.filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
    : DREAM_TAGS

  return (
    <div className="flex flex-col">
      {/* Sticky header: wyszukiwarka + X */}
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

      {/* Tagi — przewijana zawartość */}
      <div className="overflow-y-auto px-5 pb-5">
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
    </div>
  )
}
