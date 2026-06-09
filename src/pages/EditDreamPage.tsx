import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, X, Mic, MicOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DreamEditor } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { getDreamById, updateDream } from '@/storage/dreamStorage'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils'
import { Dream } from '@/types/dream'

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null
  return (
    <span className="font-ui text-xs font-light tracking-wide transition-opacity duration-300"
      style={{ color: status === 'saving' ? 'rgba(26,22,36,0.60)' : 'rgba(26,22,36,0.75)' }}>
      {status === 'saving' ? 'Zapisuję...' : 'Zapisano'}
    </span>
  )
}

export function EditDreamPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [dream, setDream] = useState<Dream | undefined>()
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialLoad = useRef(true)

  const titleMic = useSpeechRecognition()

  useEffect(() => {
    if (!id) return
    getDreamById(id).then(d => {
      setDream(d)
      if (d) { setTitle(d.title); setDescription(d.description); setTags(d.tags) }
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (loading || !dream) return
    if (isInitialLoad.current) { isInitialLoad.current = false; return }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      await updateDream(id!, { title: title.trim() || 'Sen bez nazwy', description, tags })
      setSaveStatus('saved')
    }, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [title, description, tags])

  if (loading) return null

  if (!dream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-4">🌫️</p>
        <p className="font-ui text-[#1a1624]/80">Ten sen znikł jak mgła...</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 text-[#1a1624]/75 text-sm underline underline-offset-4"
        >
          Wróć do listy
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between pt-12 px-4 pb-5 md:max-w-[900px] md:mx-auto md:w-full md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="font-ui flex items-center gap-1 text-[#1a1624]/75 hover:text-[#1a1624] transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Formularz */}
      <div className="flex-1 px-5 md:px-8 space-y-2 pb-12 max-w-[900px] mx-auto w-full">
        <div className="space-y-2">
          <div className="relative">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nazwij swój sen"
              className={cn(
                'font-ui text-[#1a1624] placeholder:text-[#1a1624]/80',
                'focus-visible:ring-[#8b5cf6]/25 focus-visible:border-[#8b5cf6]/40',
                'rounded-xl h-12 text-[0.95rem] font-light tracking-wide',
                '[background:rgba(255,255,255,0.70)] [border-color:rgba(0,0,0,0.10)]',
                '[box-shadow:0_2px_12px_rgba(83,52,131,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]',
                titleMic.isSupported && 'pr-12'
              )}
            />
            {titleMic.isSupported && (
              <button
                type="button"
                onClick={() => {
                  if (titleMic.isListening) {
                    titleMic.stop()
                  } else {
                    titleMic.start((text) => {
                      setTitle(prev => (prev.trim() ? prev.trim() + ' ' : '') + text)
                    })
                  }
                }}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95',
                  titleMic.isListening
                    ? 'bg-green-500/15 text-green-600 shadow-[0_0_8px_2px_rgba(74,222,128,0.25)] animate-pulse'
                    : 'text-[#1a1624]/80 hover:text-[#1a1624]/80 hover:bg-black/5'
                )}
              >
                {titleMic.isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            )}
          </div>
          {titleMic.isSupported && (
            <p className="font-ui text-[#1a1624]/55 text-xs px-1">
              {titleMic.isListening
                ? 'Nagrywanie wyłączy się automatycznie, gdy przestaniesz mówić.'
                : 'Kliknij w ikonę mikrofonu, aby zacząć dyktować.'}
            </p>
          )}
          {titleMic.isListening && titleMic.interim && (
            <p className="font-ui text-[#1a1624]/65 text-xs italic px-1">{titleMic.interim}</p>
          )}
        </div>

        <div className="space-y-2">
          <DreamEditor value={description} onChange={setDescription} />
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags(tags.filter(t => t !== tag))}
                className="font-ui flex items-center gap-1.5 pl-4 pr-3 h-9 rounded-full text-sm font-light tracking-wide
                           border-2 border-[#533483] text-[#533483] bg-[#ede8f5]
                           hover:bg-[#e3daf0] transition-all duration-150 active:scale-95"
              >
                {tag}
                <X size={11} className="opacity-60 shrink-0" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="font-ui flex items-center gap-2 px-4 h-9 rounded-full
                         border border-black/12 text-[#1a1624]/80 text-sm font-light tracking-wide
                         bg-white/70 hover:bg-white/90
                         transition-all duration-150 active:scale-95"
            >
              <Plus size={14} />
              Dodaj motyw
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <TagPicker selected={tags} onChange={setTags} onClose={() => setShowPicker(false)} />
      )}
    </div>
  )
}
