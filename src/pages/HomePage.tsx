import { useEffect, useState, useCallback, useRef } from 'react'
import { Trash2, Plus, X, Mic } from 'lucide-react'
import { getDreams, saveDream, updateDream, deleteDream, stripHtml } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { CalendarStrip, toDateKey } from '@/components/CalendarStrip'
import { DreamEditor, DreamEditorHandle } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { ChatPanel, ChatPanelHandle } from '@/components/ChatPanel'
import { AgentInput } from '@/components/AgentInput'
import { ChatBottomSheet } from '@/components/ChatBottomSheet'
import { getChatMessages } from '@/storage/chatStorage'
import { useAuth } from '@/context/AuthContext'

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function getToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  )
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

type Mode = 'edit' | 'add'

const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS_PL_FULL = ['stycznia','lutego','marca','kwietnia','maja','czerwca',
  'lipca','sierpnia','września','października','listopada','grudnia']
const DAYS_PL = ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota']

export function HomePage() {
  const { signOut } = useAuth()
  const isDesktop = useIsDesktop()

  const today = getToday()
  const [dreams, setDreams] = useState<Dream[]>([])
  const [dreamsByDate, setDreamsByDate] = useState<Map<string, Dream>>(new Map())

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [windowStart, setWindowStart] = useState<Date>(addDays(today, -6))

  // Entry panel state
  const [mode, setMode] = useState<Mode>('add')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const chatPanelRef = useRef<ChatPanelHandle>(null)
  const dreamEditorRef = useRef<DreamEditorHandle>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatHasMessages, setChatHasMessages] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const DEFAULT_QUESTION = 'Co może oznaczać mój sen?'
  const [dreamMicListening, setDreamMicListening] = useState(false)
  const isMicSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)

  // Refs for auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUserChangeRef = useRef(false)
  const selectedDateRef = useRef(selectedDate)
  const descriptionRef = useRef(description)
  const tagsRef = useRef(tags)
  const dreamsByDateRef = useRef(dreamsByDate)
  const modeRef = useRef(mode)

  useEffect(() => { selectedDateRef.current = selectedDate }, [selectedDate])
  useEffect(() => { descriptionRef.current = description }, [description])
  useEffect(() => { tagsRef.current = tags }, [tags])
  useEffect(() => { dreamsByDateRef.current = dreamsByDate }, [dreamsByDate])
  useEffect(() => { modeRef.current = mode }, [mode])

  const load = useCallback(async () => {
    const data = await getDreams()
    setDreams(data)
    const map = new Map<string, Dream>()
    data.forEach(d => {
      const key = toDateKey(new Date(d.createdAt))
      map.set(key, d)
    })
    setDreamsByDate(map)
    return map
  }, [])

  useEffect(() => {
    getChatMessages(toDateKey(today)).then(msgs => {
      if (msgs.length > 0) setChatHasMessages(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load().then(map => {
      const key = toDateKey(selectedDateRef.current)
      const existing = map.get(key)
      if (existing) {
        setMode('edit')
        setDescription(existing.description)
        setTags(existing.tags)
      }
    })
  }, [load])

  useEffect(() => {
    if (!isUserChangeRef.current) return
    const capturedDate = selectedDateRef.current
    const capturedDesc = description
    const capturedTags = tags
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      await doSave(capturedDate, capturedDesc, capturedTags)
    }, 800)
  }, [description, tags]) // eslint-disable-line react-hooks/exhaustive-deps

  async function doSave(date: Date, desc: string, tgs: string[]): Promise<Map<string, Dream>> {
    const key = toDateKey(date)
    const existing = dreamsByDateRef.current.get(key)
    try {
      if (existing) {
        await updateDream(existing.id, { description: desc, tags: tgs })
      } else if (desc.replace(/<[^>]*>/g, '').trim() || tgs.length > 0) {
        const dateStr = key + 'T12:00:00'
        await saveDream({ title: '', description: desc, tags: tgs, dateOverride: dateStr })
      }
      const freshMap = await load()
      setSaveStatus('saved')
      isUserChangeRef.current = false
      return freshMap
    } catch {
      setSaveStatus('idle')
      isUserChangeRef.current = false
      return dreamsByDateRef.current
    }
  }

  async function selectDay(day: Date) {
    let freshMap: Map<string, Dream> = dreamsByDateRef.current
    if (saveTimerRef.current && isUserChangeRef.current) {
      clearTimeout(saveTimerRef.current)
      freshMap = await doSave(selectedDateRef.current, descriptionRef.current, tagsRef.current)
    }
    isUserChangeRef.current = false
    setSelectedDate(day)
    const key = toDateKey(day)
    const existing = freshMap.get(key)
    if (existing) {
      setMode('edit')
      setDescription(existing.description)
      setTags(existing.tags)
    } else {
      setMode('add')
      setDescription('')
      setTags([])
    }
    setConfirmDelete(false)
    setSaveStatus('idle')
    // Reset chat state for new date
    getChatMessages(key).then(msgs => setChatHasMessages(msgs.length > 0))
  }

  useEffect(() => {
    const key = toDateKey(selectedDate)
    const existing = dreamsByDate.get(key)
    if (!existing) return
    if (modeRef.current === 'add' && !isUserChangeRef.current) {
      setMode('edit')
      setDescription(existing.description)
      setTags(existing.tags)
    }
  }, [dreamsByDate]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDescriptionChange(val: string) {
    isUserChangeRef.current = true
    setDescription(val)
  }

  function handleTagsChange(newTags: string[]) {
    isUserChangeRef.current = true
    setTags(newTags)
  }

  async function handleDelete() {
    const selectedKey = toDateKey(selectedDate)
    const existing = dreamsByDate.get(selectedKey)
    if (!existing) return
    await deleteDream(existing.id)
    await load()
    setMode('add')
    setDescription('')
    setTags([])
    setConfirmDelete(false)
  }

  const selectedKey = toDateKey(selectedDate)
  const existingDream = dreamsByDate.get(selectedKey)
  const selectedLabel = `${DAYS_PL[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS_PL_FULL[selectedDate.getMonth()]}`
  const isFuture = selectedDate > today

  const dreamHasContent =
    description.replace(/<[^>]*>/g, '').trim().length > 0 ||
    tags.length > 0 ||
    !!(existingDream && (
      existingDream.title.trim().length > 0 ||
      existingDream.description.replace(/<[^>]*>/g, '').trim().length > 0 ||
      existingDream.tags.length > 0
    ))

  useEffect(() => {
    if (!chatHasMessages) {
      setInputValue(v => {
        const isDefaultOrEmpty = v === '' || v === DEFAULT_QUESTION
        if (!isDefaultOrEmpty) return v
        return dreamHasContent ? DEFAULT_QUESTION : ''
      })
    }
  }, [dreamHasContent, chatHasMessages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Generate sidebar day list: last 90 days descending
  const sidebarDays: Date[] = []
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    sidebarDays.push(d)
  }

  const windowDaysIncludeToday = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(windowStart); d.setDate(d.getDate() + i); return toDateKey(d)
  }).includes(toDateKey(today))

  // ─── Shared modals ────────────────────────────────────────────────────────
  const modals = (
    <>
      {showPicker && (
        <TagPicker selected={tags} onChange={(t) => { handleTagsChange(t); setShowPicker(false) }} onClose={() => setShowPicker(false)} />
      )}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setConfirmDelete(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 p-5 pb-10"
            style={{ background: '#3D4254' }}>
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <p className="font-display text-white text-xl font-bold mb-1">Na pewno usunąć ten sen?</p>
            <p className="font-ui text-white/75 text-sm font-light mb-7">Nie można tego cofnąć.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="font-ui flex-1 h-12 rounded-full border border-white/20
                           text-white/90 text-sm font-light tracking-wide
                           hover:border-white/50 transition-all duration-150 active:scale-[0.98]"
              >
                Nie
              </button>
              <button
                onClick={handleDelete}
                className="font-ui flex-1 h-12 rounded-full
                           bg-gradient-to-r from-red-700/80 to-red-600/80
                           text-white text-sm font-medium tracking-wide
                           hover:from-red-600/90 hover:to-red-500/90
                           transition-all duration-150 active:scale-[0.98]"
              >
                Tak, usuń
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )

  // ─── Tags UI (shared) ─────────────────────────────────────────────────────
  const tagsUI = (
    <div>
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
  )

  // ─── MOBILE LAYOUT ────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <>
        <div className="min-h-screen flex flex-col max-w-[600px] mx-auto pb-14">
          {/* Top bar */}
          <div className="flex items-center justify-between pt-10 px-4 pb-1">
            <p className="font-display text-white text-xl">Dziennik snów</p>
            <div className="flex items-center gap-3">
              {!windowDaysIncludeToday && (
                <button
                  onClick={() => { selectDay(today); setWindowStart(addDays(today, -6)) }}
                  className="font-ui text-[0.7rem] tracking-widest uppercase px-3 h-6 rounded-full
                             border border-purple-400/50 text-purple-300
                             hover:bg-purple-400/15 hover:border-purple-400/80
                             transition-all duration-150 active:scale-95"
                >
                  Dzisiaj
                </button>
              )}
              <button
                onClick={signOut}
                className="font-ui text-white/35 hover:text-white/65 text-xs transition-colors"
              >
                Wyloguj
              </button>
            </div>
          </div>

          <CalendarStrip
            dreamsByDate={dreamsByDate}
            selectedDate={selectedDate}
            windowStart={windowStart}
            today={today}
            onSelect={selectDay}
            onPrev={() => setWindowStart(w => addDays(w, -7))}
            onNext={() => setWindowStart(w => addDays(w, 7))}
          />

          <div className="mx-4 border-t-[3px] border-white/10" />

          <div className="flex-1 flex flex-col px-4 pt-5 pb-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="label-caps">{selectedLabel}</p>
              {existingDream && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center
                             text-white/60 hover:text-white hover:bg-white/20 transition-all duration-150 active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {(mode === 'add' || mode === 'edit') && !isFuture && (
              <div className="flex-1 flex flex-col gap-3">
                {tagsUI}
                <DreamEditor ref={dreamEditorRef} key={toDateKey(selectedDate)} value={description} onChange={handleDescriptionChange} onListeningChange={setDreamMicListening} />
              </div>
            )}

            {isFuture && (
              <p className="font-ui text-white/35 text-sm italic">
                Nie można dodać wpisu dla przyszłej daty.
              </p>
            )}

            {!isFuture && isMicSupported && (
              <div className="flex-1 flex items-center justify-center mb-[16.5rem]">
                <button
                  type="button"
                  onClick={() => dreamEditorRef.current?.toggleMic()}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: dreamMicListening ? '0 0 0 8px rgba(255,255,255,0.08), 0 0 24px 4px rgba(167,139,250,0.35)' : '0 0 0 1px rgba(255,255,255,0.15)' }}
                >
                  <Mic size={28} className={dreamMicListening ? 'text-white' : 'text-white/70'} />
                  {dreamMicListening && (
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(167,139,250,0.2)' }} />
                  )}
                </button>
              </div>
            )}
          </div>

          <ChatBottomSheet
            ref={chatPanelRef}
            open={chatOpen}
            onToggle={() => setChatOpen(o => !o)}
            currentDream={existingDream}
            allDreams={dreams}
            selectedDate={selectedKey}
            showStrip={chatHasMessages}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[600px] mx-auto rounded-b-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', borderTop: 'none' }}>
            <AgentInput
              value={inputValue}
              onChange={setInputValue}
              onSend={(text) => {
                setChatHasMessages(true)
                setChatOpen(true)
                chatPanelRef.current?.sendMessage(text)
              }}
              isLoading={false}
              dreamHasContent={dreamHasContent}
              placeholder={chatHasMessages ? 'Zadaj pytanie...' : 'Co może oznaczać mój sen?'}
            />
          </div>
        </div>
        {modals}
      </>
    )
  }

  // ─── DESKTOP LAYOUT ───────────────────────────────────────────────────────
  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ background: '#1a1625' }}>

        {/* ── Left sidebar: day list ── */}
        <div className="w-[240px] shrink-0 flex flex-col border-r border-white/10 overflow-hidden">
          {/* Title */}
          <div className="px-6 pt-8 pb-5 shrink-0">
            <p className="font-display text-white text-xl">mój dzienniczek.</p>
          </div>

          {/* Scrollable day list */}
          <div className="flex-1 overflow-y-auto">
            {sidebarDays.map(day => {
              const key = toDateKey(day)
              const isToday = key === toDateKey(today)
              const isSelected = key === selectedKey
              const dream = dreamsByDate.get(key)
              const preview = dream ? stripHtml(dream.description).slice(0, 42) : null
              const dayAbbr = DAYS_SHORT[day.getDay()]

              return (
                <button
                  key={key}
                  onClick={() => selectDay(day)}
                  className={`w-full text-left px-5 py-2.5 flex items-center gap-3 border-b border-white/5
                              hover:bg-white/5 transition-colors duration-100
                              ${isSelected ? 'bg-white/10' : ''}`}
                >
                  {/* Date column */}
                  <div className="w-9 shrink-0 flex flex-col items-start">
                    <span className={`text-[9px] uppercase tracking-widest font-ui
                                     ${isToday ? 'text-violet-400' : 'text-white/35'}`}>
                      {isToday ? 'DZIŚ' : dayAbbr}
                    </span>
                    <span className={`text-2xl leading-tight font-light tabular-nums
                                     ${isSelected ? 'text-white' : 'text-white/70'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Preview */}
                  {preview ? (
                    <span className="text-[11px] text-white/45 font-ui font-light leading-snug line-clamp-2 flex-1">
                      {preview}
                    </span>
                  ) : (
                    <span className="flex-1" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/10 shrink-0 flex items-center justify-between">
            <span className="text-[10px] text-white/20 font-ui">dziennik snów</span>
            <button
              onClick={signOut}
              className="text-[10px] text-white/30 hover:text-white/60 font-ui transition-colors"
            >
              Wyloguj
            </button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Dream editor area — scrollable */}
          <div className="flex-1 overflow-y-auto px-10 pt-10 pb-6">
            {/* Date header */}
            <div className="flex items-center justify-between mb-6">
              <p className="label-caps">{selectedLabel}</p>
              {existingDream && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center
                             text-white/60 hover:text-white hover:bg-white/20 transition-all duration-150 active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {isFuture ? (
              <p className="font-ui text-white/35 text-sm italic">
                Nie można dodać wpisu dla przyszłej daty.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {tagsUI}
                <DreamEditor
                  ref={dreamEditorRef}
                  key={toDateKey(selectedDate)}
                  value={description}
                  onChange={handleDescriptionChange}
                  onListeningChange={setDreamMicListening}
                />
              </div>
            )}

            {/* Empty state with mic */}
            {!isFuture && !dreamHasContent && isMicSupported && (
              <div className="flex flex-col items-center justify-center py-20 gap-5">
                <p className="font-ui text-white/20 text-[10px] uppercase tracking-[0.2em]">
                  nothing here yet
                </p>
                <button
                  type="button"
                  onClick={() => dreamEditorRef.current?.toggleMic()}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: dreamMicListening
                      ? '0 0 0 8px rgba(255,255,255,0.08), 0 0 24px 4px rgba(167,139,250,0.35)'
                      : '0 0 0 1px rgba(255,255,255,0.15)',
                  }}
                >
                  <Mic size={28} className={dreamMicListening ? 'text-white' : 'text-white/60'} />
                  {dreamMicListening && (
                    <span className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: 'rgba(167,139,250,0.2)' }} />
                  )}
                </button>
                <p className="font-ui text-white/20 text-[10px]">
                  tap to record what's on your mind
                </p>
              </div>
            )}
          </div>

          {/* ── Chat section — anchored at bottom ── */}
          <div
            className="shrink-0 flex flex-col border-t border-white/10"
            style={{
              height: '300px',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            {/* Chat header */}
            <div className="shrink-0 px-6 py-3 border-b border-white/8">
              <span className="label-caps text-[10px]">Analiza snu</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <ChatPanel
                ref={chatPanelRef}
                currentDream={existingDream}
                allDreams={dreams}
                selectedDate={selectedKey}
              />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 pb-3 pt-1">
              <AgentInput
                value={inputValue}
                onChange={setInputValue}
                onSend={(text) => {
                  setChatHasMessages(true)
                  chatPanelRef.current?.sendMessage(text)
                }}
                isLoading={chatPanelRef.current?.isLoading ?? false}
                dreamHasContent={dreamHasContent}
                placeholder={chatHasMessages ? 'Zadaj pytanie...' : 'Co może oznaczać mój sen?'}
              />
            </div>
          </div>

        </div>
      </div>
      {modals}
    </>
  )
}
