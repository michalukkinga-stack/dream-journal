import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Dream } from '@/types/dream'
import { toDateKey } from '@/components/CalendarStrip'

const MONTHS_PL_FULL = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
]
const DAYS_PL_SHORT = ['Pn','Wt','Śr','Cz','Pt','Sb','Nd']

interface MonthCalendarModalProps {
  dreamsByDate: Map<string, Dream>
  selectedDate: Date
  today: Date
  onSelect: (d: Date) => void
  onClose: () => void
}

function mondayBasedDow(d: Date): number {
  return (d.getDay() + 6) % 7
}

function buildMonthCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = mondayBasedDow(firstDay)
  const cells: (Date | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

interface MonthGridProps {
  year: number
  month: number
  dreamsByDate: Map<string, Dream>
  selectedKey: string
  todayKey: string
  today: Date
  onSelect: (d: Date) => void
  onClose: () => void
}

function MonthGrid({ year, month, dreamsByDate, selectedKey, todayKey, today, onSelect, onClose }: MonthGridProps) {
  const cells = buildMonthCells(year, month)

  return (
    <div>
      <div className="font-display text-white text-sm font-semibold tracking-wide mb-3 text-center">
        {MONTHS_PL_FULL[month]} {year}
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PL_SHORT.map(d => (
          <div key={d} className="font-ui text-[0.6rem] tracking-widest uppercase text-white/40 text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`blank-${idx}`} />
          const key = toDateKey(day)
          const isFuture = day > today
          const isSelected = key === selectedKey
          const isToday = key === todayKey
          const hasDream = dreamsByDate.has(key)

          return (
            <button
              key={key}
              disabled={isFuture}
              onClick={() => { onSelect(day); onClose() }}
              className={[
                'relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 transition-all duration-150',
                isFuture ? 'opacity-25 cursor-default' : 'hover:bg-white/10 active:scale-95',
                isSelected ? 'bg-white/20 ring-2 ring-violet-400' : '',
              ].join(' ')}
            >
              <span className={[
                'font-display text-base leading-none',
                isToday && !isSelected ? 'text-violet-300 font-semibold' : 'text-white',
                isSelected ? 'font-semibold' : '',
              ].join(' ')}>
                {day.getDate()}
              </span>
              {!isFuture && (
                hasDream ? (
                  <span className="text-[11px] leading-none text-violet-400">★</span>
                ) : (
                  <span className={[
                    'text-[11px] leading-none',
                    isSelected ? 'text-white/70' : 'text-white/35',
                  ].join(' ')}>☆</span>
                )
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MonthCalendarModal({
  dreamsByDate,
  selectedDate,
  today,
  onSelect,
  onClose,
}: MonthCalendarModalProps) {
  const selectedKey = toDateKey(selectedDate)
  const todayKey = toDateKey(today)

  // Build list of months from Jan of selected year up to current month
  const months: { year: number; month: number }[] = []
  const startYear = selectedDate.getFullYear()
  const endYear = today.getFullYear()
  const endMonth = today.getMonth()

  for (let y = startYear; y <= endYear; y++) {
    const mStart = 0
    const mEnd = y === endYear ? endMonth : 11
    for (let m = mStart; m <= mEnd; m++) {
      months.push({ year: y, month: m })
    }
  }

  // Scroll to selected month on open
  const selectedMonthRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    selectedMonthRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl border border-white/15 flex flex-col
          w-[95vw] max-w-[900px] md:w-[85vw]
          max-h-[85vh]"
        style={{ background: '#1f2937', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>

        {/* Scrollable months grid */}
        <div className="overflow-y-auto p-6 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {months.map(({ year, month }) => {
              const isSelectedMonth =
                year === selectedDate.getFullYear() && month === selectedDate.getMonth()
              return (
                <div key={`${year}-${month}`} ref={isSelectedMonth ? selectedMonthRef : undefined}>
                  <MonthGrid
                    year={year}
                    month={month}
                    dreamsByDate={dreamsByDate}
                    selectedKey={selectedKey}
                    todayKey={todayKey}
                    today={today}
                    onSelect={onSelect}
                    onClose={onClose}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
