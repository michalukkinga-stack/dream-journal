import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DreamEditor } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { saveDream } from '@/storage/dreamStorage'

export function AddDreamPage() {
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
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 pt-12 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="font-ui flex items-center gap-1 text-[#6b5f80] hover:text-[#2d2440] transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>
      </div>

      {/* Tytuł ekranu */}
      <div className="px-5 pb-6">
        <p className="label-caps mb-2">Nowy wpis</p>
        <h1 className="font-display text-[#2d2440] text-4xl">Nowy sen</h1>
        <p className="font-ui text-[#6b5f80] text-[0.85rem] font-light mt-1 tracking-wide">
          Zapisz zanim zniknie
        </p>
      </div>

      {/* Formularz */}
      <div className="flex-1 px-5 space-y-2 pb-36">

        {/* Tytuł */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (e.target.value.trim()) setError('')
            }}
            placeholder="Nazwij swój sen"
            className="font-ui bg-white/50 border-white/70 text-[#2d2440] placeholder:text-[#9d90b0]
                       focus-visible:ring-purple-300/50 focus-visible:border-purple-300/60
                       rounded-xl h-12 text-[0.95rem] font-light tracking-wide"
          />
          {error && (
            <p className="text-red-400/80 text-xs mt-1">{error}</p>
          )}
        </div>

        {/* Tagi */}
        <div className="space-y-3">

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="font-ui px-3 py-1.5 rounded-full text-xs font-light tracking-wide
                             border border-purple-300/60 text-purple-600 bg-purple-100/50"
                >
                  {tag}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-7 h-7 rounded-full border border-purple-300/50 text-purple-500
                           flex items-center justify-center bg-white/40
                           hover:border-purple-400 hover:text-purple-700
                           transition-all duration-150 active:scale-95"
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="font-ui flex items-center gap-2 px-4 py-2.5 rounded-full
                         border border-purple-200/70 text-purple-500 text-sm font-light tracking-wide
                         bg-white/40 hover:border-purple-300 hover:text-purple-700
                         transition-all duration-150 active:scale-95"
            >
              <Plus size={14} />
              Dodaj motyw
            </button>
          )}
        </div>

        {/* Opis */}
        <div className="space-y-2">
          <DreamEditor value={description} onChange={setDescription} />
        </div>
      </div>

      {/* Przycisk zapisu – sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 pb-8
                      bg-gradient-to-t from-[#f0e8ff]/90 to-transparent">
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

      {/* Tag picker bottom sheet */}
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
