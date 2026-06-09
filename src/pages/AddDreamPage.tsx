import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, X, Mic } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DreamEditor } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { saveDream, updateDream } from '@/storage/dreamStorage'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils'

interface AddDreamPageProps {
  desktopMode?: boolean
  onSaved?: () => void
}

export function AddDreamPage({ desktopMode = false, onSaved }: AddDreamPageProps = {}) {
  const navigate = useNavigate()
  const titleMic = useSpeechRecognition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const draftIdRef = useRef<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasContent = title.trim().length > 0 || description.replace(/<[^>]*>/g, '').trim().length > 0

  useEffect(() => {
    if (!hasContent) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      const effectiveTitle = title.trim() || 'Sen bez nazwy'
      try {
        if (!draftIdRef.current) {
          const dream = await saveDream({ title: effectiveTitle, description, tags })
          draftIdRef.current = dream.id
          setDraftId(dream.id)
        } else {
          await updateDream(draftIdRef.current, { title: effectiveTitle, description, tags })
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('idle')
      }
    }, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [title, description, tags])

  function handleBack() {
    if (draftIdRef.current) {
      if (desktopMode && onSaved) { onSaved() } else { navigate('/home', { replace: true }) }
    } else {
      if (desktopMode && onSaved) { onSaved() } else { navigate(-1) }
    }
  }

  return (
    <div className={desktopMode ? 'flex flex-col h-full' : 'min-h-screen flex flex-col animate-slide-in-right'}>
      {/* Header – tylko mobile */}
      {!desktopMode && (
        <>
          <div className="flex items-center justify-between pt-12 px-4 pb-5">
            <button
              onClick={handleBack}
              className="font-ui flex items-center gap-1 text-[#1a1624]/75 hover:text-[#1a1624] transition-colors py-2 pr-3 text-sm font-light tracking-wide"
            >
              <ChevronLeft size={20} />
              <span className="text-sm">wróć</span>
            </button>
            <SaveIndicator status={saveStatus} />
          </div>
          <div className="px-5 pb-6">
            <h1 className="font-display text-[#1a1624] text-4xl">Nowy sen</h1>
          </div>
        </>
      )}

      {/* Tytuł ekranu – desktop */}
      {desktopMode && (
        <div className="w-full max-w-[900px] mx-auto px-8 pt-6 pb-4 flex items-center justify-between">
          <h1 className="font-display text-[#1a1624] text-4xl">Nowy sen</h1>
          <SaveIndicator status={saveStatus} />
        </div>
      )}

      {/* Formularz */}
      <div className={`flex-1 space-y-2 ${desktopMode ? 'w-full max-w-[900px] mx-auto px-8 overflow-y-auto pb-8' : 'px-5 pb-12'}`}>

        {/* Tytuł */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              value={titleMic.isListening ? (title ? title + ' ' : '') + (titleMic.interim || '') : title}
              onChange={(e) => {
                if (!titleMic.isListening) setTitle(e.target.value)
              }}
              placeholder="Nazwij swój sen"
              className={cn(
                'font-ui text-[#1a1624] placeholder:text-[#1a1624]/55',
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
                    : 'text-[#1a1624]/55 hover:text-[#1a1624]/80 hover:bg-black/5'
                )}
              >
                <Mic size={14} />
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
                className="w-9 h-9 rounded-full border border-black/12 text-[#1a1624]/75
                           flex items-center justify-center bg-white/70
                           hover:bg-white/90 transition-all duration-150 active:scale-95"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
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
          )}
        </div>
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

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null
  return (
    <span className="font-ui text-xs font-light tracking-wide transition-opacity duration-300"
      style={{ color: status === 'saving' ? 'rgba(26,22,36,0.60)' : 'rgba(26,22,36,0.75)' }}>
      {status === 'saving' ? 'Zapisuję...' : 'Zapisano'}
    </span>
  )
}
