import { useEffect, useState, useCallback } from 'react'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import { getDreams, saveDream, updateDream, deleteDream, stripHtml } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { CalendarStrip, toDateKey } from '@/components/CalendarStrip'
import { DreamEditor } from '@/components/DreamEditor'
import { TagPicker } from '@/components/TagPicker'
import { Button } from '@/components/ui/button'
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
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

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

  // When selected date changes, update the entry panel
  function selectDay(day: Date) {
    setSelectedDate(day)
    const key = toDateKey(day)
    const existing = dreamsByDate.get(key)
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
  }

  // Also sync panel when dreams load
  useEffect(() => {
    const key = toDateKey(selectedDate)
    const existing = dreamsByDate.get(key)
    if (existing) {
      setMode('view')
      setDescription(existing.description)
      setTags(existing.tags)
    }
    // don't reset to 'add' here — only do that on explicit date change
  }, [dreamsByDate]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true)
    const selectedKey = toDateKey(selectedDate)
    const existing = dreamsByDate.get(selectedKey)
    if (existing) {
      await updateDream(existing.id, { description, tags })
    } else {
      // Set created_at to the selected date at noon local time
      const dateStr = selectedKey + 'T12:00:00'
      await saveDream({ title: '', description, tags, dateOverride: dateStr })
    }
    const newMap = await load()
    setSaving(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
    // Switch to view
    const updated = newMap.get(selectedKey)
    if (updated) {
      setMode('view')
      setDescription(updated.description)
      setTags(updated.tags)
    }
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

  return (
    <div className="min-h-screen flex flex-col max-w-[600px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-10 px-4 pb-1">
        <p className="font-display text-white text-xl">Dziennik snów</p>
        <button
          onClick={signOut}
          className="font-ui text-white/35 hover:text-white/65 text-xs transition-colors"
        >
          Wyloguj
        </button>
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

          {mode === 'edit' && (
            <button
              onClick={() => {
                const d = existingDream
                if (d) { setDescription(d.description); setTags(d.tags) }
                setMode('view')
              }}
              className="font-ui text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              Anuluj
            </button>
          )}
        </div>

        {/* Saved confirmation */}
        {showSaved && (
          <p className="font-ui text-purple-300 text-sm mb-3 animate-fade-in">Sen zapisany ✓</p>
        )}

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
            <DreamEditor value={description} onChange={setDescription} />

            {/* Tags */}
            <div className="pt-1">
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTags(tags.filter(t => t !== tag))}
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

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="font-ui w-full h-12 rounded-full bg-gradient-to-r from-[#533483] to-[#6a44a0]
                           text-white font-medium text-[0.95rem] tracking-wide
                           shadow-lg shadow-purple-900/50
                           hover:from-[#6a44a0] hover:to-[#7d55b8]
                           active:scale-[0.98] transition-all duration-150 border-0
                           disabled:opacity-50"
              >
                {saving ? 'Zapisywanie…' : 'Zapisz sen'}
              </Button>
            </div>
          </div>
        )}

        {isFuture && (
          <p className="font-ui text-white/35 text-sm italic">
            Nie można dodać wpisu dla przyszłej daty.
          </p>
        )}
      </div>

      {showPicker && (
        <TagPicker selected={tags} onChange={setTags} onClose={() => setShowPicker(false)} />
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
