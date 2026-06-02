import { useEffect, useState, useCallback, useRef } from 'react'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import { getDreams, saveDream, updateDream, deleteDream, stripHtml } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { CalendarStrip, toDateKey } from '@/components/CalendarStrip'
import { DreamEditor } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { AgentInput } from '@/components/AgentInput'
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

type Mode = 'view' | 'edit' | 'add'

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

  useEffect(() => { load() }, [load])

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

  async function doSave(date: Date, desc: string, tgs: string[]) {
    const key = toDateKey(date)
    const existing = dreamsByDateRef.current.get(key)
    try {
      if (existing) {
        await updateDream(existing.id, { description: desc, tags: tgs })
      } else if (desc.replace(/<[^>]*>/g, '').trim()) {
        const dateStr = key + 'T12:00:00'
        await saveDream({ title: '', description: desc, tags: tgs, dateOverride: dateStr })
      }
      await load()
      setSaveStatus('saved')
    } catch {
      setSaveStatus('idle')
    }
    isUserChangeRef.current = false
  }

  // When selected date changes, flush pending save then update panel
  async function selectDay(day: Date) {
    // Flush pending save for current day
    if (saveTimerRef.current && isUserChangeRef.current) {
      clearTimeout(saveTimerRef.current)
      await doSave(selectedDateRef.current, descriptionRef.current, tagsRef.current)
    }
    isUserChangeRef.current = false
    setSelectedDate(day)
    const key = toDateKey(day)
    const existing = dreamsByDateRef.current.get(key)
    if (existing) {
      setMode('view')
      setDescription(existing.description)
      setTags(existing.tags)
    } else {
      setMode('add')
      setDescription('')
      setTags([])
    }
    setConfirmDelete(false)
    setSaveStatus('idle')
  }

  // Sync panel when dreams load (after save)
  useEffect(() => {
    const key = toDateKey(selectedDate)
    const existing = dreamsByDate.get(key)
    if (existing && modeRef.current === 'view') {
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

  const windowDaysIncludeToday = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(windowStart); d.setDate(d.getDate() + i); return toDateKey(d)
  }).includes(toDateKey(today))

  return (
    <div className="min-h-screen flex flex-col max-w-[600px] mx-auto pb-0">
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

      {/* Calendar strip */}
      <CalendarStrip
        dreamsByDate={dreamsByDate}
        selectedDate={selectedDate}
        windowStart={windowStart}
        today={today}
        onSelect={selectDay}
        onPrev={() => setWindowStart(w => addDays(w, -7))}
        onNext={() => setWindowStart(w => addDays(w, 7))}
      />

      {/* Divider */}
      <div className="mx-4 border-t border-white/10" />

      {/* Entry panel */}
      <div className="flex-1 flex flex-col px-4 pt-5 pb-8 overflow-y-auto">
        {/* Date label + actions */}
        <div className="flex items-center justify-between mb-4">
          <p className="label-caps">{selectedLabel}</p>

          {mode === 'view' && existingDream && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('edit')}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center
                           text-white/60 hover:text-white hover:bg-white/18 transition-all duration-150 active:scale-95"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center
                           text-white/60 hover:text-red-400 hover:bg-red-500/15 transition-all duration-150 active:scale-95"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

            {mode === 'edit' && saveStatus !== 'idle' && (
            <span className="font-ui text-xs font-light tracking-wide"
              style={{ color: saveStatus === 'saving' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.55)' }}>
              {saveStatus === 'saving' ? 'Zapisuję...' : 'Zapisano'}
            </span>
          )}
        </div>

        {/* View mode */}
        {mode === 'view' && existingDream && (
          <div className="flex-1">
            {stripHtml(existingDream.description) ? (
              <div
                className="font-ui dream-prose text-[0.95rem] font-light leading-[1.85]"
                dangerouslySetInnerHTML={{ __html: existingDream.description }}
              />
            ) : (
              <p className="font-ui text-white/40 text-sm italic">Brak opisu.</p>
            )}
            {existingDream.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {existingDream.tags.map(tag => (
                  <span
                    key={tag}
                    className="font-ui px-4 h-7 flex items-center rounded-full text-sm font-light tracking-wide
                               border border-[#2a1a4a] text-[#2a1a4a] bg-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add / Edit mode */}
        {(mode === 'add' || mode === 'edit') && !isFuture && (
          <div className="flex-1 flex flex-col gap-3">
            <DreamEditor key={toDateKey(selectedDate)} value={description} onChange={handleDescriptionChange} />

            {/* Tags */}
            <div className="pt-1">
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagsChange(tags.filter(t => t !== tag))}
                      className="font-ui flex items-center gap-1.5 pl-4 pr-3 h-7 rounded-full text-sm font-light tracking-wide
                                 border border-[#2a1a4a] text-[#2a1a4a] bg-white/60
                                 hover:bg-white/80 transition-all duration-150 active:scale-95"
                    >
                      {tag}
                      <X size={11} className="opacity-60 shrink-0" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="w-7 h-7 rounded-full border border-[#2a1a4a] text-[#2a1a4a]
                               flex items-center justify-center bg-white/60
                               hover:bg-white/80 transition-all duration-150 active:scale-95"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="font-ui flex items-center gap-2 px-4 h-7 rounded-full
                             border border-[#2a1a4a] text-[#2a1a4a] text-[0.95rem] font-medium tracking-wide
                             bg-white/60 hover:bg-white/80
                             transition-all duration-150 active:scale-95"
                >
                  <Plus size={14} />
                  Dodaj motyw
                </button>
              )}
            </div>

            {/* Auto-save status (add mode) */}
            {mode === 'add' && saveStatus !== 'idle' && (
              <p className="font-ui text-xs font-light tracking-wide"
                style={{ color: saveStatus === 'saving' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.55)' }}>
                {saveStatus === 'saving' ? 'Zapisuję...' : 'Zapisano'}
              </p>
            )}
          </div>
        )}

        {isFuture && (
          <p className="font-ui text-white/35 text-sm italic">
            Nie można dodać wpisu dla przyszłej daty.
          </p>
        )}
      </div>

      <AgentInput />

      {showPicker && (
        <TagPicker selected={tags} onChange={(t) => { handleTagsChange(t); setShowPicker(false) }} onClose={() => setShowPicker(false)} />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
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
      )}
    </div>
  )
}
