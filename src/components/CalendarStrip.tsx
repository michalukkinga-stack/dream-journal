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
  minDate?: Date
  onSelect: (d: Date) => void
  onPrev: () => void
  onNext: () => void
}

export function CalendarStrip({
  dreamsByDate,
  selectedDate,
  windowStart,
  today,
  minDate,
  onSelect,
  onPrev,
  onNext,
}: CalendarStripProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(windowStart, i))
  const canNext = addDays(windowStart, 7) <= today
  const canPrev = minDate ? windowStart > minDate : true

  const selectedKey = toDateKey(selectedDate)
  return (
    <div className="relative py-3">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={[
          'absolute left-[-10px] top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 z-10',
          canPrev ? 'text-white hover:bg-white/10' : 'text-white/20 cursor-default',
        ].join(' ')}
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex gap-1.5 px-4">
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
                  : 'border border-white/15 hover:bg-white/10',
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
          'absolute right-[-10px] top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 z-10',
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
