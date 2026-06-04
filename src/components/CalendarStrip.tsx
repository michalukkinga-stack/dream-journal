import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dream } from '@/types/dream'

const MONTHS_PL = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru']

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

interface CalendarStripProps {
  dreamsByDate: Map<string, Dream>
  selectedDate: Date
  windowStart: Date
  today: Date
  onSelect: (d: Date) => void
  onPrev: () => void
  onNext: () => void
}

export function CalendarStrip({
  dreamsByDate,
  selectedDate,
  windowStart,
  today,
  onSelect,
  onPrev,
  onNext,
}: CalendarStripProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(windowStart, i))
  const canNext = addDays(windowStart, 7) <= today

  const selectedKey = toDateKey(selectedDate)
  const todayKey = toDateKey(today)
  return (
    <div className="flex items-center gap-1 px-2 py-3">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-all duration-150 shrink-0"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex flex-1 gap-1.5">
        {days.map(day => {
          const key = toDateKey(day)
          const isFuture = day > today
          const isSelected = key === selectedKey
          const hasDream = dreamsByDate.has(key)

          return (
            <button
              key={key}
              onClick={() => !isFuture && onSelect(day)}
              disabled={isFuture}
              className={[
                'flex-1 relative flex flex-col items-center justify-center pt-2 pb-[24px] rounded-2xl transition-all duration-150',
                isFuture ? 'opacity-30 cursor-default' : 'active:scale-95',
                isSelected && !isFuture
                  ? 'bg-white/20 ring-2 ring-violet-400'
                  : 'hover:bg-white/10',
              ].join(' ')}
            >
              <span className={[
                'font-display text-lg leading-none',
                isSelected && !isFuture ? 'text-white font-semibold' : 'text-white',
              ].join(' ')}>
                {day.getDate()}
              </span>
              <span className={[
                'font-ui text-[0.6rem] mt-0.5 tracking-wide uppercase',
                isSelected && !isFuture ? 'text-white' : 'text-white',
              ].join(' ')}>
                {MONTHS_PL[day.getMonth()]}
              </span>
              {!isFuture && (
                <div className="absolute bottom-1.5 flex items-center justify-center">
                  {hasDream ? (
                    <div className="w-[9px] h-[9px] rounded-full bg-violet-400" />
                  ) : (
                    <div className={[
                      'w-[9px] h-[9px] rounded-full border',
                      isSelected ? 'border-white/70' : 'border-white/40',
                    ].join(' ')} />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className={[
          'w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 shrink-0',
          canNext
            ? 'text-white hover:bg-white/10'
            : 'text-white/20 cursor-default',
        ].join(' ')}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
