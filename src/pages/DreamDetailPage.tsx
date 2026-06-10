import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2, X, Plus, Mic } from 'lucide-react'
import { getDreamById, getDreams, updateDream, deleteDream, formatDate } from '@/storage/dreamStorage'
import { MobileHeader } from '@/components/MobileHeader'
import { Dream } from '@/types/dream'
import { DreamEditor, DreamEditorHandle } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { ChatBottomSheet } from '@/components/ChatBottomSheet'
import { ChatPanelHandle } from '@/components/ChatPanel'
import { AgentInput } from '@/components/AgentInput'
import { getChatMessages } from '@/storage/chatStorage'
import { toDateKey } from '@/components/CalendarStrip'

function DeleteConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onCancel} />

      {/* Mobile: sheet od dołu */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 p-5 pb-10"
        style={{ background: '#1f2937' }}>
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <p className="font-display text-white text-xl font-bold mb-1">Na pewno usunąć ten sen?</p>
        <p className="font-ui text-white/75 text-sm font-light mb-7">Nie można tego cofnąć.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="font-ui flex-1 h-12 rounded-full border border-white/20
                       text-white/90 text-sm font-light tracking-wide
                       hover:border-white/50 transition-all duration-150 active:scale-[0.98]">
            Nie
          </button>
          <button onClick={onConfirm}
            className="font-ui flex-1 h-12 rounded-full
                       bg-gradient-to-r from-red-700/80 to-red-600/80
                       text-white text-sm font-medium tracking-wide
                       hover:from-red-600/90 hover:to-red-500/90
                       transition-all duration-150 active:scale-[0.98]">
            Tak, usuń
          </button>
        </div>
      </div>

      {/* Desktop: centered modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-white/12 p-6"
          style={{ background: '#1f2937' }}>
          <p className="font-display text-white text-xl font-bold mb-1">Na pewno usunąć ten sen?</p>
          <p className="font-ui text-white/60 text-sm font-light mb-6">Nie można tego cofnąć.</p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="font-ui flex-1 h-11 rounded-full border border-white/20
                         text-white/90 text-sm font-light tracking-wide
                         hover:border-white/50 transition-all duration-150 active:scale-[0.98]">
              Anuluj
            </button>
            <button onClick={onConfirm}
              className="font-ui flex-1 h-11 rounded-full
                         bg-gradient-to-r from-red-700/80 to-red-600/80
                         text-white text-sm font-medium tracking-wide
                         hover:from-red-600/90 hover:to-red-500/90
                         transition-all duration-150 active:scale-[0.98]">
              Usuń
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function DreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [dream, setDream] = useState<Dream | undefined>()
  const [allDreams, setAllDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Editing state
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [dreamMicListening, setDreamMicListening] = useState(false)
  const dreamEditorRef = useRef<DreamEditorHandle>(null)

  // Auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUserChangeRef = useRef(false)
  const descriptionRef = useRef(description)
  const tagsRef = useRef(tags)
  useEffect(() => { descriptionRef.current = description }, [description])
  useEffect(() => { tagsRef.current = tags }, [tags])

  // Chat state
  const chatPanelRef = useRef<ChatPanelHandle>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatHasMessages, setChatHasMessages] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const DEFAULT_QUESTION = 'Co może oznaczać mój sen?'

  const isMicSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)

  const load = useCallback(async () => {
    if (!id) return
    const [d, all] = await Promise.all([getDreamById(id), getDreams()])
    setDream(d)
    setAllDreams(all)
    if (d) {
      setDescription(d.description)
      setTags(d.tags)
      const dateKey = toDateKey(new Date(d.createdAt))
      const msgs = await getChatMessages(dateKey)
      setChatHasMessages(msgs.length > 0)
      setInputValue(msgs.length > 0 ? '' : DEFAULT_QUESTION)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  // Auto-save
  useEffect(() => {
    if (!isUserChangeRef.current || !id) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      await updateDream(id, { description: descriptionRef.current, tags: tagsRef.current })
      isUserChangeRef.current = false
    }, 800)
  }, [description, tags]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDescriptionChange(val: string) {
    isUserChangeRef.current = true
    setDescription(val)
  }

  function handleTagsChange(newTags: string[]) {
    isUserChangeRef.current = true
    setTags(newTags)
  }

  async function handleDelete() {
    if (id) {
      await deleteDream(id)
      navigate(-1)
    }
  }

  const hasText = description.replace(/<[^>]*>/g, '').trim().length > 0
  const dreamHasContent = hasText || tags.length > 0

  const selectedDate = dream ? toDateKey(new Date(dream.createdAt)) : ''

  if (loading) return null

  if (!dream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-4">🌫️</p>
        <p className="font-ui text-white/60">Ten sen znikł jak mgła...</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-white/50 text-sm underline underline-offset-4">
          Wróć do listy
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen flex flex-col max-w-[600px] mx-auto pb-14">
        <MobileHeader />

        {/* Header */}
        <div className="flex items-center px-4 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="font-ui flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors py-2 pr-3 text-sm font-light"
          >
            <ChevronLeft size={20} />
            <span>wróć do listy</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-4 pb-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="label-caps">{formatDate(dream.createdAt)}</p>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center
                         text-white/60 hover:text-white hover:bg-white/20 transition-all duration-150 active:scale-95"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Tags */}
          <div className="mb-3">
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 items-center">
                {tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagsChange(tags.filter(t => t !== tag))}
                    className="font-ui flex items-center gap-1.5 pl-4 pr-3 h-7 rounded-full text-sm font-light tracking-wide
                               border border-white/20 text-white bg-white/10
                               hover:bg-white/20 transition-all duration-150 active:scale-95"
                  >
                    {tag}
                    <X size={11} className="opacity-60 shrink-0" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="w-7 h-7 rounded-full border border-white/20 text-white
                             flex items-center justify-center bg-white/10
                             hover:bg-white/20 transition-all duration-150 active:scale-95"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="font-ui flex items-center gap-2 px-4 h-7 rounded-full
                           border border-white/20 text-white text-[0.95rem] font-medium tracking-wide
                           bg-white/10 hover:bg-white/20
                           transition-all duration-150 active:scale-95"
              >
                <Plus size={14} />
                Dodaj motyw
              </button>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col gap-3">
            <DreamEditor
              ref={dreamEditorRef}
              key={id}
              value={description}
              onChange={handleDescriptionChange}
              onListeningChange={setDreamMicListening}
            />

            {/* Mic button (mobile, in-flow) */}
            {isMicSupported && (
              <div className="flex flex-col items-center gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => dreamEditorRef.current?.toggleMic()}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: dreamMicListening
                      ? '0 0 0 8px rgba(255,255,255,0.08), 0 0 24px 4px rgba(167,139,250,0.35)'
                      : '0 0 0 1px rgba(255,255,255,0.15)',
                  }}
                >
                  <Mic size={28} className={dreamMicListening ? 'text-white' : 'text-white/70'} />
                  {dreamMicListening && (
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(167,139,250,0.2)' }} />
                  )}
                </button>
                <p className="font-ui text-white/70 text-xs text-center">Kliknij w ikonę mikrofonu, aby zacząć dyktować.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <ChatBottomSheet
          ref={chatPanelRef}
          open={chatOpen}
          onToggle={() => setChatOpen(o => !o)}
          currentDream={{ ...dream, description, tags }}
          allDreams={allDreams}
          selectedDate={selectedDate}
          showStrip={chatHasMessages}
        />

        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[600px] mx-auto">
          <AgentInput
            value={inputValue}
            onChange={setInputValue}
            onSend={(text) => { setChatHasMessages(true); setChatOpen(true); chatPanelRef.current?.sendMessage(text) }}
            isLoading={false}
            dreamHasContent={dreamHasContent}
            placeholder={chatHasMessages ? 'Zadaj pytanie...' : 'Co może oznaczać mój sen?'}
          />
        </div>
      </div>

      {showPicker && (
        <TagPicker
          selected={tags}
          onChange={(t) => { handleTagsChange(t); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {confirmDelete && (
        <DeleteConfirm onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
      )}
    </>
  )
}
