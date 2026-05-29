import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DreamEditor } from '@/components/DreamEditor'
import { saveDream } from '@/storage/dreamStorage'

export function AddDreamPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  function handleSave() {
    if (!title.trim()) {
      setError('Tytuł snu jest wymagany.')
      return
    }
    setError('')
    saveDream({ title: title.trim(), description })
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 pt-12 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="font-ui flex items-center gap-1 text-[#8fa3bf] hover:text-[#f0e6d3] transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>
      </div>

      {/* Tytuł ekranu */}
      <div className="px-5 pb-6">
        <p className="label-caps mb-2">Nowy wpis</p>
        <h1 className="font-display text-[#f0e6d3] text-4xl">Nowy sen</h1>
        <p className="font-ui text-[#8fa3bf] text-[0.85rem] font-light mt-1 tracking-wide">Zapisz zanim zniknie</p>
      </div>

      {/* Formularz */}
      <div className="flex-1 px-5 space-y-6 pb-36">
        {/* Tytuł */}
        <div className="space-y-2">
          <Label className="label-caps">
            Tytuł snu
          </Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (e.target.value.trim()) setError('')
            }}
            placeholder="nazwij swój sen"
            className="font-ui bg-white/5 border-white/10 text-[#f0e6d3] placeholder:text-white/20
                       focus-visible:ring-[#94d5c9]/40 focus-visible:border-[#94d5c9]/30
                       rounded-xl h-12 text-[0.95rem] font-light tracking-wide"
          />
          {error && (
            <p className="text-red-400/80 text-xs mt-1">{error}</p>
          )}
        </div>

        {/* Opis */}
        <div className="space-y-2">
          <Label className="label-caps">
            Opis snu
          </Label>
          <DreamEditor value={description} onChange={setDescription} />
        </div>
      </div>

      {/* Przycisk zapisu – sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 pb-8
                      bg-gradient-to-t from-[#0f3460]/90 to-transparent">
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
    </div>
  )
}
