import { useEffect, useRef, useState } from 'react'
import { X, Search, Plus } from 'lucide-react'
import Highlighter from 'react-highlight-words'
import { DREAM_TAGS } from '@/constants/tags'

const CUSTOM_TAGS_KEY = 'dream_custom_tags'

function loadCustomTags(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_TAGS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveCustomTag(tag: string) {
  const existing = loadCustomTags()
  if (!existing.includes(tag)) {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify([...existing, tag]))
  }
}

function getAllTags(customTags: string[]): string[] {
  const combined = [...DREAM_TAGS, ...customTags.filter(t => !DREAM_TAGS.includes(t))]
  return combined
}

interface TagPickerProps {
  selected: string[]
  onChange: (tags: string[]) => void
  onClose: () => void
}

export function TagPicker({ selected, onChange, onClose }: TagPickerProps) {
  const [desktopSelected, setDesktopSelected] = useState(selected)
  const [customTags, setCustomTags] = useState<string[]>(loadCustomTags)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function toggle(tag: string) {
    setDesktopSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function addNewTag(tag: string) {
    saveCustomTag(tag)
    setCustomTags(loadCustomTags())
    setDesktopSelected(prev => prev.includes(tag) ? prev : [...prev, tag])
  }

  function handleSave() {
    onChange(desktopSelected)
    onClose()
  }

  const allTags = getAllTags(customTags)

  const sheetStyle = {
    background: 'linear-gradient(160deg, #ede9f7 0%, #f5ecf3 50%, #eaf2f7 100%)',
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* ── MOBILE bottom sheet ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50
                   rounded-t-3xl border-t border-black/5 animate-slide-up
                   flex flex-col max-h-[67vh]"
        style={sheetStyle}
      >
        <SheetContent allTags={allTags} selected={desktopSelected} onClose={onClose} toggle={toggle} onSave={handleSave} onAddTag={addNewTag} fullWidth />
      </div>

      {/* ── DESKTOP centered dialog ── */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
        <div
          className="relative w-full max-w-[900px] rounded-2xl shadow-2xl flex flex-col max-h-[72vh]"
          style={{
            ...sheetStyle,
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 20px 60px rgba(83,52,131,0.18)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetContent
            allTags={allTags}
            selected={desktopSelected}
            onClose={onClose}
            toggle={toggle}
            onSave={handleSave}
            onAddTag={addNewTag}
          />
        </div>
      </div>
    </>
  )
}

function SheetContent({
  allTags,
  selected,
  onClose,
  toggle,
  onSave,
  onAddTag,
  fullWidth = false,
}: {
  allTags: string[]
  selected: string[]
  onClose: () => void
  toggle: (tag: string) => void
  onSave?: () => void
  onAddTag: (tag: string) => void
  fullWidth?: boolean
}) {
  const [query, setQuery] = useState('')
  const [hasMoreBelow, setHasMoreBelow] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function checkScroll() {
    const el = scrollRef.current
    if (!el) return
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
  }

  useEffect(() => {
    checkScroll()
  })

  const trimmed = query.trim()
  const filtered = trimmed
    ? allTags.filter(tag => tag.toLowerCase().includes(trimmed.toLowerCase()))
    : allTags

  const exactMatch = allTags.some(tag => tag.toLowerCase() === trimmed.toLowerCase())
  const canAdd = trimmed.length > 0 && !exactMatch

  const footerStyle = {
    background: 'linear-gradient(160deg, #ede9f7 0%, #f5ecf3 50%, #eaf2f7 100%)',
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Handle + header */}
      <div className="shrink-0 px-5 pt-4 pb-3 relative">
        <div className="flex justify-center mb-3 md:hidden">
          <div className="w-10 h-1 rounded-full bg-black/15" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/8
                     flex items-center justify-center z-10
                     text-[#1a1624]/75 hover:text-[#1a1624] transition-colors"
        >
          <X size={16} />
        </button>
        <p className="font-display text-[#1a1624] text-xl font-bold pr-10 mb-3">Wybierz motywy</p>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1624]/55" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Wyszukaj lub dodaj motyw"
            autoFocus
            className="font-ui w-full h-10 pl-9 pr-9 rounded-full
                       bg-white/70 border border-black/10
                       text-[#1a1624] placeholder:text-[#1a1624]/55 text-sm font-light tracking-wide
                       focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/20
                       transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         w-5 h-5 rounded-full bg-black/8 hover:bg-black/15
                         flex items-center justify-center transition-colors"
            >
              <X size={11} className="text-[#1a1624]/80" />
            </button>
          )}
        </div>
      </div>

      {/* Tagi */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={`flex-1 min-h-0 overflow-y-scroll px-5 ${onSave ? 'pb-24' : 'pb-5'}`}
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        >
          {canAdd && (
            <div className="mb-3">
              <button
                onClick={() => { onAddTag(trimmed); setQuery('') }}
                className="flex items-center gap-2 px-4 h-9 rounded-full
                           bg-[#1a1624] text-white
                           text-sm font-ui font-medium tracking-wide
                           hover:bg-[#2d2440] active:scale-95 transition-all duration-150"
              >
                <Plus size={14} />
                Dodaj „{trimmed}"
              </button>
            </div>
          )}
          {filtered.length === 0 && !canAdd ? (
            <p className="font-ui text-[#1a1624]/65 text-sm font-light text-center py-8 tracking-wide">
              Brak pasujących motywów
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filtered.map(tag => {
                const isSelected = selected.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggle(tag)}
                    className={[
                      'px-4 h-9 rounded-full text-sm font-ui tracking-wide',
                      'transition-all duration-150 active:scale-95',
                      isSelected
                        ? 'border-2 border-[#533483] bg-[#ede8f5] text-[#533483] font-medium'
                        : 'border border-black/12 bg-white/70 text-[#1a1624] font-light hover:bg-white/90 hover:border-black/20',
                    ].join(' ')}
                  >
                    <Highlighter
                      searchWords={[query]}
                      autoEscape
                      textToHighlight={tag}
                      highlightClassName="bg-transparent font-semibold text-[#533483] not-italic"
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
            style={footerStyle}
          >
            {hasMoreBelow && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, #eaf2f7)', top: '-60px' }}
              />
            )}
            <button
              onClick={onSave}
              className={`relative font-ui h-14 rounded-full
                         bg-[#1a1624]
                         text-white font-medium text-[0.95rem] tracking-widest uppercase
                         shadow-lg shadow-black/20
                         hover:bg-[#2d2440]
                         active:scale-[0.98] transition-all duration-150
                         ${fullWidth ? 'w-full' : 'px-10'}`}
            >
              Zapisz
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
