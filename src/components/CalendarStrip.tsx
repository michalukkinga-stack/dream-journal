import { useEffect, useRef } from 'react'
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
  onPrev?: () => void
  onNext?: () => void
}

export function CalendarStrip({
  dreamsByDate,
  selectedDate,
  today,
  minDate,
  onSelect,
}: CalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  const fallback = addDays(today, -29)
  const start = minDate && minDate < fallback ? minDate : fallback
  const days: Date[] = []
  let cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setHours(0, 0, 0, 0)
  while (cur <= end) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }

  const selectedKey = toDateKey(selectedDate)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedKey])

  return (
    <div className="py-1.5">
      <div
        ref={scrollRef}
        className="flex gap-1.5 px-4 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map(day => {
          const key = toDateKey(day)
          const isFuture = day > today
          const isSelected = key === selectedKey
          const hasDream = dreamsByDate.has(key)

          return (
            <button
              key={key}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => !isFuture && onSelect(day)}
              disabled={isFuture}
              className={[
                'flex-none w-11 relative flex flex-col items-center justify-center pt-2 pb-[24px] rounded-2xl transition-all duration-150',
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
                    <span className="text-[11px] leading-none text-violet-400">★</span>
                  ) : (
                    <span className={[
                      'text-[11px] leading-none',
                      isSelected ? 'text-white/70' : 'text-white/40',
                    ].join(' ')}>☆</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
