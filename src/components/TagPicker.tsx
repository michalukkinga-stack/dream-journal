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
                   flex flex-col"
        style={{
          height: '67vh',
          background: 'linear-gradient(180deg, rgba(245,238,255,0.97) 0%, rgba(252,232,244,0.97) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <SheetContent selected={selected} onClose={onClose} toggle={toggle} />
      </div>

      {/* ── DESKTOP centered dialog ── */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
        <div
          className="relative w-full max-w-lg rounded-2xl shadow-xl flex flex-col"
          style={{
            maxHeight: '80vh',
            background: 'linear-gradient(160deg, rgba(245,238,255,0.99) 0%, rgba(252,232,244,0.99) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(200,180,240,0.3)',
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
    <>
      {/* X */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/5
                   flex items-center justify-center z-10
                   text-[#6b5f80] hover:text-[#2d2440] transition-colors"
      >
        <X size={16} />
      </button>

      {/* Wyszukiwarka */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9d90b0]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj motywu..."
            autoFocus
            className="font-ui w-full h-10 pl-9 pr-4 rounded-full
                       bg-white/60 border border-purple-200/60
                       text-[#2d2440] placeholder:text-[#b0a0c0] text-sm font-light tracking-wide
                       focus:outline-none focus:border-purple-300/80 focus:ring-1 focus:ring-purple-200/50
                       transition-all"
          />
        </div>
      </div>

      {/* Tagi */}
      <div className="flex-1 overflow-y-auto px-5 pb-2">
        {filtered.length === 0 ? (
          <p className="font-ui text-[#9d90b0] text-sm font-light text-center py-8 tracking-wide">
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
                    'px-4 py-2 rounded-full text-sm font-ui font-light tracking-wide',
                    'border transition-all duration-150 active:scale-95',
                    isSelected
                      ? 'border-purple-400 text-purple-700 bg-purple-100/70'
                      : 'border-purple-200/60 text-[#6b5f80] bg-white/40 hover:border-purple-300',
                  ].join(' ')}
                >
                  <Highlighter
                    searchWords={[query]}
                    autoEscape
                    textToHighlight={tag}
                    highlightClassName="bg-transparent font-semibold text-purple-700 not-italic"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pt-3 pb-6 border-t border-purple-100/50 shrink-0">
        <button
          onClick={onClose}
          className="font-ui w-full rounded-full py-3.5
                     bg-gradient-to-r from-[#533483] to-[#6a44a0]
                     text-white font-medium text-[0.95rem] tracking-wide
                     shadow-lg shadow-purple-900/40
                     hover:from-[#6a44a0] hover:to-[#7d55b8]
                     active:scale-[0.98] transition-all duration-150"
        >
          Zapisz
        </button>
      </div>
    </>
  )
}
