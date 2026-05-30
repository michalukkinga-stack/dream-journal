import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DreamEditor } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { getDreamById, updateDream } from '@/storage/dreamStorage'

export function EditDreamPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dream = id ? getDreamById(id) : undefined

  const [title, setTitle] = useState(dream?.title ?? '')
  const [description, setDescription] = useState(dream?.description ?? '')
  const [tags, setTags] = useState<string[]>(dream?.tags ?? [])
  const [showPicker, setShowPicker] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  if (!dream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-4">🌫️</p>
        <p className="text-white/65">Ten sen znikł jak mgła...</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 text-white/70 text-sm underline underline-offset-4"
        >
          Wróć do listy
        </button>
      </div>
    )
  }

  const isDirty =
    title.trim() !== dream.title ||
    description !== dream.description ||
    JSON.stringify(tags) !== JSON.stringify(dream.tags)

  function handleBack() {
    if (isDirty) {
      setShowConfirm(true)
    } else {
      navigate(-1)
    }
  }

  function handleSave() {
    if (!title.trim()) {
      setError('Tytuł snu jest wymagany.')
      return
    }
    setError('')
    updateDream(id!, { title: title.trim(), description, tags })
    navigate(`/dream/${id}`, { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 pt-12 px-4 pb-4">
        <button
          onClick={handleBack}
          className="font-ui flex items-center gap-1 text-white/70 hover:text-white transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>
      </div>

      {/* Tytuł ekranu */}
      <div className="px-5 pb-6">
        <p className="label-caps mb-2">Edycja</p>
        <h1 className="font-display text-white text-4xl">Edytuj sen</h1>
        <p className="font-ui text-white/85 text-[0.85rem] font-light mt-1 tracking-wide">
          Popraw, co chcesz zmienić
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

        {/* Motywy */}
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
                         border border-[#3D4254]/50 text-[#3D4254] text-sm font-light tracking-wide
                         bg-white/50 hover:bg-white/70
                         transition-all duration-150 active:scale-95"
            >
              <Plus size={14} />
              Dodaj motyw
            </button>
          )}
        </div>
      </div>

      {/* Przycisk zapisu */}
      <div className="sticky bottom-0 p-4 pb-8 bg-gradient-to-t from-black/40 to-transparent">
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

      {/* Dialog potwierdzenia cofnięcia */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
            <div
              className="w-full rounded-3xl p-7 text-center border border-white/15"
              style={{
                background: 'rgba(30, 18, 66, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <p className="font-display text-white text-2xl leading-snug mb-2">
                Porzucić zmiany?
              </p>
              <p className="font-ui text-white/65 text-sm font-light mb-7">
                Niezapisane zmiany w tym śnie przepadną.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="w-full rounded-full py-3.5 font-ui font-medium text-[0.95rem]
                             bg-gradient-to-r from-[#533483] to-[#6a44a0]
                             text-white shadow-lg shadow-purple-900/40
                             active:scale-[0.98] transition-all duration-150"
                >
                  Tak, wróć bez zapisywania
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full rounded-full py-3.5 font-ui font-light text-[0.95rem]
                             text-white/70 border border-white/20 bg-white/8
                             active:scale-[0.98] transition-all duration-150"
                >
                  Zostań i edytuj dalej
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
