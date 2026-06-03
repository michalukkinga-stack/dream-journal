import { useState } from 'react'
import { Mic, SendHorizonal } from 'lucide-react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils'

interface AgentInputProps {
  onSend: (text: string) => void
  isLoading?: boolean
  dreamHasContent?: boolean
  placeholder?: string
}

export function AgentInput({ onSend, isLoading = false, dreamHasContent = false, placeholder = 'Co może oznaczać mój sen?' }: AgentInputProps) {
  const [value, setValue] = useState('')
  const mic = useSpeechRecognition()

  const displayValue = mic.isListening
    ? (value ? value + ' ' : '') + (mic.interim || '')
    : value

  function handleSend() {
    const text = value.trim()
    if (!text || isLoading) return
    setValue('')
    onSend(text)
  }

  return (
    <div className="shrink-0 px-4 pb-8 pt-3 border-t border-white/10 bg-transparent">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={placeholder}
            value={displayValue}
            onChange={(e) => { if (!mic.isListening) setValue(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
            className={cn(
              'w-full border border-white/20 rounded-xl px-4 py-3 font-ui text-white',
              'placeholder:text-white/35 bg-white/10 backdrop-blur-sm',
              'focus:outline-none focus:ring-2 focus:ring-white/25',
              mic.isSupported && 'pr-12'
            )}
          />
          {mic.isSupported && (
            <button
              type="button"
              onClick={() => {
                if (mic.isListening) {
                  mic.stop()
                } else {
                  mic.start(text => setValue(prev => (prev ? prev + ' ' : '') + text))
                }
              }}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full',
                'flex items-center justify-center transition-all duration-150 active:scale-95',
                mic.isListening
                  ? 'bg-green-500/20 text-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.35)] animate-pulse'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/10'
              )}
            >
              <Mic size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || isLoading || !dreamHasContent}
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            'bg-gradient-to-br from-[#533483] to-[#6a44a0]',
            'shadow-lg shadow-purple-900/40',
            'transition-all duration-150 active:scale-95',
            'disabled:opacity-30'
          )}
        >
          <SendHorizonal size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}
