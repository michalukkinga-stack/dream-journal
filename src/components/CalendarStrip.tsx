import React from 'react'
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
  onPrev?: () => void
  onNext?: () => void
  onTodayVisibilityChange?: (visible: boolean) => void
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
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(windowStart, i))

  const selectedKey = toDateKey(selectedDate)
  const todayKey = toDateKey(today)

  const windowEnd = addDays(windowStart, 6)
  const canGoNext = windowEnd < today

  const effectiveMin = minDate ?? addDays(today, -29)
  const canGoPrev = windowStart > effectiveMin

  return (
    <div className="py-1.5 flex items-center gap-1 px-2">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="flex-none p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10
                   disabled:opacity-20 disabled:cursor-default transition-all active:scale-95"
        aria-label="Poprzedni tydzień"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex-1 flex gap-1.5 justify-between">
        {days.map(day => {
          const key = toDateKey(day)
          const isFuture = day > today
          const isSelected = key === selectedKey
          const isToday = key === todayKey
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
                  : 'bg-white/[0.04] backdrop-blur-sm border border-white/15 hover:bg-white/10',
                isToday && !isSelected ? 'border-violet-400/50' : '',
              ].join(' ')}
            >
              <span className={[
                'font-display text-lg leading-none',
                isSelected && !isFuture ? 'text-white font-semibold' : 'text-white',
              ].join(' ')}>
                {day.getDate()}
              </span>
              <span className="font-ui text-[0.6rem] mt-0.5 tracking-wide uppercase text-white">
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

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="flex-none p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10
                   disabled:opacity-20 disabled:cursor-default transition-all active:scale-95"
        aria-label="Następny tydzień"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
