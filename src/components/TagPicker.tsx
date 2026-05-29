import { useEffect } from 'react'
import { X } from 'lucide-react'
import { DREAM_TAGS } from '@/constants/tags'

interface TagPickerProps {
  selected: string[]
  onChange: (tags: string[]) => void
  onClose: () => void
}

export function TagPicker({ selected, onChange, onClose }: TagPickerProps) {
  // Blokuj scroll body gdy sheet jest otwarty
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

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50
                   rounded-t-3xl border-t border-white/10
                   animate-slide-up"
        style={{
          background: 'linear-gradient(180deg, #16213e 0%, #0f3460 100%)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-5">
          <div>
            <p className="label-caps mb-1">Tagi snu</p>
            <h2 className="font-display text-[#f0e6d3] text-2xl leading-tight">
              Co to był za sen?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center
                       text-[#8fa3bf] hover:text-[#f0e6d3] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tag grid */}
        <div className="px-5 pb-4 max-h-[52vh] overflow-y-auto">
          <div className="flex flex-wrap gap-2.5">
            {DREAM_TAGS.map(tag => {
              const isSelected = selected.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggle(tag)}
                  className={[
                    'px-4 py-2 rounded-full text-sm font-ui font-light tracking-wide',
                    'border transition-all duration-150 active:scale-95',
                    isSelected
                      ? 'border-[#94d5c9] text-[#94d5c9] bg-[#94d5c9]/10'
                      : 'border-white/15 text-[#8fa3bf] bg-white/4 hover:border-white/30',
                  ].join(' ')}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-10 border-t border-white/8">
          <button
            onClick={onClose}
            className="font-ui w-full h-13 rounded-full
                       bg-gradient-to-r from-[#533483] to-[#6a44a0]
                       text-white font-medium text-[0.95rem] tracking-wide
                       shadow-lg shadow-purple-900/40
                       hover:from-[#6a44a0] hover:to-[#7d55b8]
                       active:scale-[0.98] transition-all duration-150
                       py-3.5"
          >
            {selected.length > 0
              ? `Gotowe · ${selected.length} ${selected.length === 1 ? 'tag' : 'tagów'}`
              : 'Gotowe'}
          </button>
        </div>
      </div>
    </>
  )
}
