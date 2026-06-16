import { useEffect, useState, useCallback, useRef } from 'react'
import { Trash2, Plus, X, Mic, MoreVertical } from 'lucide-react'
import { getDreams, saveDream, updateDream, deleteDream } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { CalendarStrip, toDateKey } from '@/components/CalendarStrip'
import { DreamEditor, DreamEditorHandle } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { ChatPanelHandle } from '@/components/ChatPanel'
import { AgentInput } from '@/components/AgentInput'
import { ChatBottomSheet } from '@/components/ChatBottomSheet'
import { getChatMessages } from '@/storage/chatStorage'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MobileHeader } from '@/components/MobileHeader'

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

type Mode = 'edit' | 'add'

export function HomePage() {
  const { signOut } = useAuth()

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


  // Refs for auto-save (capture latest values in async closures)
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

  // Sprawdź przy starcie czy są zapisane wiadomości
  useEffect(() => {
    getChatMessages(toDateKey(today)).then(msgs => {
      if (msgs.length > 0) setChatHasMessages(true)
    })
  }, [])

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

  // Auto-save when description or tags change (user-initiated only)
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

  // When selected date changes, flush pending save then update panel
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
    getChatMessages(toDateKey(day)).then(msgs => {
      setChatHasMessages(msgs.length > 0)
      if (msgs.length === 0) setChatOpen(false)
    })
  }

  // Sync panel when dreams load (after save or initial load)
  useEffect(() => {
    const key = toDateKey(selectedDate)
    const existing = dreamsByDate.get(key)
    if (!existing) return
    if (modeRef.current === 'add' && !isUserChangeRef.current) {
      // Dream exists for this date but we're in add mode (initial load or post-save)
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

  const MONTHS_PL_FULL = ['stycznia','lutego','marca','kwietnia','maja','czerwca',
    'lipca','sierpnia','września','października','listopada','grudnia']
  const DAYS_PL = ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota']

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

  // Auto-fill input with default question when day has content and chat hasn't started yet
  useEffect(() => {
    if (!chatHasMessages) {
      setInputValue(v => {
        const isDefaultOrEmpty = v === '' || v === DEFAULT_QUESTION
        if (!isDefaultOrEmpty) return v
        return dreamHasContent ? DEFAULT_QUESTION : ''
      })
    }
  }, [dreamHasContent, chatHasMessages]) // eslint-disable-line react-hooks/exhaustive-deps

  const windowDaysIncludeToday = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(windowStart); d.setDate(d.getDate() + i); return toDateKey(d)
  }).includes(toDateKey(today))

  const oldestDream = dreams.length > 0
    ? dreams.reduce((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? a : b)
    : null
  const minDate = oldestDream ? (() => { const d = new Date(oldestDream.createdAt); d.setHours(0,0,0,0); return d })() : undefined

  // Desktop: 1700 dni wstecz (~4.5 roku), dziś na górze listy
  const desktopDays = Array.from({ length: 1700 }, (_, i) => addDays(today, -i))
  const DAYS_PL_SHORT = ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota']

  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const desktopMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!desktopMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [desktopMenuOpen])


  const hasText = description.replace(/<[^>]*>/g, '').trim().length > 0

  const entryPanel = (
    <div className="flex-1 flex flex-col px-4 pt-5 pb-8 overflow-y-auto md:max-w-[900px]">
      {/* Date label + actions */}
      <div className="flex items-center justify-between mb-4 md:mb-[30px]">
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
          <div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 items-center">
                {tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagsChange(tags.filter(t => t !== tag))}
                    className="font-ui flex items-center gap-1.5 pl-4 pr-3 h-7 rounded-full text-sm font-light tracking-wide
                               border border-violet-400/50 bg-violet-400/15 text-violet-300
                               hover:bg-violet-400/25 transition-all duration-150 active:scale-95"
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
          <DreamEditor ref={dreamEditorRef} key={toDateKey(selectedDate)} value={description} onChange={handleDescriptionChange} onListeningChange={setDreamMicListening} />
          {isMicSupported && hasText && (
            <div className="hidden md:flex flex-col items-center gap-4" style={{ marginTop: '20px' }}>
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
              <p className="font-ui text-white/70 text-xs text-center">Kliknij w ikonę mikrofonu, aby zacząć dyktować.</p>
            </div>
          )}
        </div>
      )}

      {isFuture && (
        <p className="font-ui text-white/35 text-sm italic">
          Nie można dodać wpisu dla przyszłej daty.
        </p>
      )}

      {!isFuture && isMicSupported && (() => {
        const micBtn = (
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
        )
        const micLabel = <p className="font-ui text-white/70 text-xs text-center">Kliknij w ikonę mikrofonu, aby zacząć dyktować.</p>
        return (
          <>
            {/* Mobile: in-flow */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 mb-[16.5rem] md:hidden">
              {micBtn}{micLabel}
            </div>
            {/* Desktop: fixed, centered — only when no content */}
            {!hasText && (
              <div className="hidden md:flex flex-col items-center justify-center gap-4 fixed top-0 bottom-0 pointer-events-none [&>*]:pointer-events-auto" style={{ left: '264px', width: '900px' }}>
                {micBtn}{micLabel}
              </div>
            )}
          </>
        )
      })()}
    </div>
  )

  const deleteConfirm = confirmDelete && (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setConfirmDelete(false)}
      />
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
  )

  return (
    <>
      {/* ── MOBILE layout (< md) ── */}
      <div className="md:hidden min-h-screen flex flex-col max-w-[600px] mx-auto pb-14">
        <MobileHeader />

        {toDateKey(selectedDate) !== toDateKey(today) && (
          <div className="flex justify-start px-4 pb-1">
            <button
              onClick={() => {
                selectDay(today)
                setWindowStart(addDays(today, -6))
              }}
              className="font-ui text-[0.65rem] tracking-widest uppercase px-3 h-6 rounded-full
                         border border-purple-400/50 text-purple-300
                         hover:bg-purple-400/15 hover:border-purple-400/80
                         transition-all duration-150 active:scale-95"
            >
              Dzisiaj
            </button>
          </div>
        )}

        <CalendarStrip
          dreamsByDate={dreamsByDate}
          selectedDate={selectedDate}
          windowStart={windowStart}
          today={today}
          minDate={minDate}
          onSelect={selectDay}
          onPrev={() => setWindowStart(w => addDays(w, -7))}
          onNext={() => setWindowStart(w => addDays(w, 7))}
        />


        {entryPanel}

        <ChatBottomSheet
          ref={chatPanelRef}
          open={chatOpen}
          onToggle={() => setChatOpen(o => !o)}
          currentDream={existingDream}
          allDreams={dreams}
          selectedDate={selectedKey}
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

        {showPicker && (
          <TagPicker selected={tags} onChange={(t) => { handleTagsChange(t); setShowPicker(false) }} onClose={() => setShowPicker(false)} />
        )}

        {deleteConfirm}
      </div>

      {/* ── DESKTOP layout (≥ md) ── */}
      <div className="hidden md:flex min-h-screen">
        {/* Left panel — app name + scrollable days */}
        <div className="w-56 flex flex-col shrink-0 h-screen sticky top-0">
          {/* App name + links + Dzisiaj button */}
          <div className="px-5 pt-8 pb-4 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative" ref={desktopMenuRef}>
                <button
                  onClick={() => setDesktopMenuOpen(o => !o)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 ${
                    desktopMenuOpen ? 'text-white bg-white/15' : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MoreVertical size={20} />
                </button>
                {desktopMenuOpen && (
                  <div
                    className="absolute left-0 top-11 z-50 rounded-2xl border border-white/15 py-1 min-w-[200px]"
                    style={{ background: '#1f2937', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  >
                    <Link
                      to="/dreams"
                      onClick={() => setDesktopMenuOpen(false)}
                      className="font-ui flex items-center px-4 h-11 text-sm text-violet-400 hover:text-violet-300 hover:bg-white/8 transition-colors whitespace-nowrap"
                    >
                      Przeglądaj wszystkie wpisy
                    </Link>
                    <Link
                      to="/api-docs"
                      onClick={() => setDesktopMenuOpen(false)}
                      className="font-ui flex items-center px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      API Docs
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDesktopMenuOpen(false)}
                      className="font-ui flex items-center px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      Ustawienia
                    </Link>
                    <div className="mx-4 h-px bg-white/10" />
                    <button
                      onClick={() => { setDesktopMenuOpen(false); signOut() }}
                      className="font-ui w-full flex items-center px-4 h-11 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      Wylogowanie
                    </button>
                  </div>
                )}
              </div>
              <p className="font-display text-white text-xl">Dziennik snów</p>
            </div>
            <button
              onClick={() => {
                selectDay(today)
                desktopScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              style={{ visibility: toDateKey(selectedDate) !== toDateKey(today) ? 'visible' : 'hidden' }}
              className="font-ui text-[0.65rem] tracking-widest uppercase px-3 h-6 rounded-full
                         border border-purple-400/50 text-purple-300
                         hover:bg-purple-400/15 hover:border-purple-400/80
                         transition-all duration-150 active:scale-95"
            >
              Dzisiaj
            </button>
          </div>

          {/* Scrollable days list — today at top, oldest at bottom */}
          <div ref={desktopScrollRef} className="flex-1 overflow-y-auto flex flex-col">
            {desktopDays.map(day => {
              const key = toDateKey(day)
              const isSelected = key === toDateKey(selectedDate)
              const hasDream = dreamsByDate.has(key)
              const isToday = key === toDateKey(today)

              return (
                <div key={key} className="shrink-0 px-2 py-1">
                  <button
                    onClick={() => selectDay(day)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 text-left',
                      'border border-white/15 hover:bg-white/10 active:scale-[0.98]',
                      isSelected ? 'bg-white/20 ring-2 ring-violet-400' : '',
                    ].join(' ')}
                  >
                    <div className="flex flex-col shrink-0 min-w-0 gap-[8px]">
                      <span className={[
                        'font-ui text-[1.05rem] leading-none',
                        isSelected ? 'text-white font-semibold' : 'text-white/80',
                      ].join(' ')}>
                        {day.getDate()} {MONTHS_PL_FULL[day.getMonth()]}
                      </span>
                      <span className={[
                        'font-ui text-[0.6rem] tracking-widest uppercase',
                        isSelected ? 'text-white' : 'text-white/50',
                      ].join(' ')}>
                        {DAYS_PL_SHORT[day.getDay()]}
                      </span>
                    </div>
                    <div className="ml-auto shrink-0">
                      {hasDream ? (
                        <div className="w-[9px] h-[9px] rounded-full bg-violet-400" />
                      ) : (
                        <div className={[
                          'w-[9px] h-[9px] rounded-full border',
                          isSelected ? 'border-white/70' : 'border-white/40',
                        ].join(' ')} />
                      )}
                    </div>
                  </button>
                </div>
              )
            })}
          </div>

        </div>

        {/* Right panel — entry form */}
        <div className="flex-1 flex flex-col min-h-screen pl-[40px] relative">
          {/* Spacer matching left panel title height so content aligns with first day row */}
          <div className="h-[104px] shrink-0" />
          {entryPanel}

          <ChatBottomSheet
            ref={chatPanelRef}
            open={chatOpen}
            onToggle={() => setChatOpen(o => !o)}
            currentDream={existingDream}
            allDreams={dreams}
            selectedDate={selectedKey}
            showStrip={chatHasMessages}
          />

          <div className="fixed bottom-0 z-50" style={{ left: '264px', width: '900px' }}>
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
      </div>

      {showPicker && (
        <TagPicker selected={tags} onChange={(t) => { handleTagsChange(t); setShowPicker(false) }} onClose={() => setShowPicker(false)} />
      )}

      {deleteConfirm}
    </>
  )
}
