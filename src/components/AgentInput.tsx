import { SendHorizonal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentInputProps {
  value: string
  onChange: (v: string) => void
  onSend: (text: string) => void
  isLoading?: boolean
  dreamHasContent?: boolean
  placeholder?: string
}

export function AgentInput({ value, onChange, onSend, isLoading = false, dreamHasContent = false, placeholder = 'Co może oznaczać mój sen?' }: AgentInputProps) {
  function handleSend() {
    const text = value.trim()
    if (!text || isLoading) return
    onChange('')
    onSend(text)
  }

  return (
    <div className="shrink-0 px-4 pb-8 md:pb-3 pt-3">
      <div
        className="relative flex items-center gap-2 rounded-2xl"
        style={{
          padding: '12px',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
          className={cn(
            'flex-1 border border-white/20 rounded-xl px-4 py-3 font-ui text-white',
            'placeholder:text-white/35 bg-white/10 backdrop-blur-sm',
            'focus:outline-none focus:ring-2 focus:ring-white/25',
          )}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !dreamHasContent}
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            'bg-violet-400',
            'shadow-lg shadow-violet-400/40',
            'transition-all duration-150 active:scale-95',
            'disabled:opacity-30',
            dreamHasContent && !value.trim() && 'opacity-50'
          )}
        >
          <SendHorizonal size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}
