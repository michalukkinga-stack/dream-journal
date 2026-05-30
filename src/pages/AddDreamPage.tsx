import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DreamEditor } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { saveDream } from '@/storage/dreamStorage'

interface AddDreamPageProps {
  desktopMode?: boolean
  onSaved?: () => void
}

export function AddDreamPage({ desktopMode = false, onSaved }: AddDreamPageProps = {}) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState('')

  function handleSave() {
    if (!title.trim()) {
      setError('Tytuł snu jest wymagany.')
      return
    }
    setError('')
    saveDream({ title: title.trim(), description, tags })
    if (desktopMode && onSaved) {
      onSaved()
    } else {
      navigate('/home', { replace: true })
    }
  }

  return (
    <div className={desktopMode ? 'flex flex-col h-full' : 'min-h-screen flex flex-col animate-slide-in-right'}>
      {/* Header – tylko mobile */}
      {!desktopMode && (
        <>
          <div className="flex items-center gap-2 pt-12 px-4 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="font-ui flex items-center gap-1 text-white/70 hover:text-white transition-colors py-2 pr-3 text-sm font-light tracking-wide"
            >
              <ChevronLeft size={20} />
              <span className="text-sm">wróć</span>
            </button>
          </div>
          <div className="px-5 pb-6">
            <h1 className="font-display text-white text-4xl">Nowy sen</h1>
            <p className="font-ui text-white/85 text-[0.85rem] font-light mt-1 tracking-wide">
              Zapisz zanim zniknie
            </p>
          </div>
        </>
      )}

      {/* Tytuł ekranu – desktop */}
      {desktopMode && (
        <div className="w-full max-w-[900px] mx-auto px-8 pt-6 pb-4">
          <h1 className="font-display text-white text-4xl">Nowy sen</h1>
          <p className="font-ui text-white/85 text-[0.85rem] font-light mt-1 tracking-wide">
            Zapisz zanim zniknie
          </p>
        </div>
      )}

      {/* Formularz */}
      <div className={`flex-1 space-y-2 ${desktopMode ? 'w-full max-w-[900px] mx-auto px-8 overflow-y-auto pb-8' : 'px-5 pb-36'}`}>

        {/* Tytuł */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (e.target.value.trim()) setError('')
            }}
            placeholder="Nazwij swój sen"
            className="font-ui text-white placeholder:text-white/40
                       focus-visible:ring-white/20 focus-visible:border-white/30
                       rounded-xl h-12 text-[0.95rem] font-light tracking-wide
                       [background:rgba(255,255,255,0.07)] [border-color:rgba(255,255,255,0.12)]
                       [box-shadow:0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
          />
          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>

        {/* Opis */}
        <div className="space-y-2">
          <DreamEditor value={description} onChange={setDescription} />
        </div>

        {/* Tagi */}
        <div className="space-y-3 pt-1">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="font-ui px-3 py-1.5 rounded-full text-xs font-light tracking-wide
                             border border-white/25 text-white/90 bg-white/10"
                >
                  {tag}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-7 h-7 rounded-full border border-white/25 text-white/90
                           flex items-center justify-center bg-white/10
                           hover:bg-white/20 transition-all duration-150 active:scale-95"
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="font-ui flex items-center gap-2 px-4 py-2.5 rounded-full
                         border border-white/25 text-white/90 text-sm font-light tracking-wide
                         bg-white/10 hover:bg-white/20
                         transition-all duration-150 active:scale-95"
            >
              <Plus size={14} />
              Dodaj motyw
            </button>
          )}
        </div>
      </div>

      {/* Przycisk zapisu */}
      <div className={desktopMode
        ? 'w-full max-w-[900px] mx-auto px-8 pb-10 pt-4'
        : 'sticky bottom-0 p-4 pb-8 bg-gradient-to-t from-black/40 to-transparent'
      }>
        <Button
          onClick={handleSave}
          className="font-ui w-full h-14 rounded-full bg-gradient-to-r from-[#533483] to-[#6a44a0]
                     text-white font-medium text-[0.95rem] tracking-wide
                     shadow-lg shadow-purple-900/50
                     hover:from-[#6a44a0] hover:to-[#7d55b8]
                     active:scale-[0.98] transition-all duration-150 border-0"
        >
          Zapisz sen
        </Button>
      </div>

      {showPicker && (
        <TagPicker
          selected={tags}
          onChange={setTags}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
