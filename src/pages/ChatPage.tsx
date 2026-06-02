import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useChat } from '@ai-sdk/react'
import { ArrowLeft, Mic, SendHorizonal, X } from 'lucide-react'
import { ChatMessage } from '@/components/ChatMessage'
import { getChatMessages, saveChatMessage } from '@/storage/chatStorage'
import { getDreams, stripHtml } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils'
import { toDateKey } from '@/components/CalendarStrip'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

type CurrentDream = {
  id: string
  title: string
  description: string
  tags: string[]
  createdAt: string
}

export function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mic = useSpeechRecognition()

  const passedDream = (location.state as { currentDream?: CurrentDream } | null)?.currentDream
  const [contextDream, setContextDream] = useState<CurrentDream | undefined>(passedDream)
  const [allDreams, setAllDreams] = useState<Dream[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, input, setInput, handleSubmit, isLoading, setMessages } = useChat({
    api: `${SUPABASE_URL}/functions/v1/jung-chat`,
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: {
      currentDream: contextDream
        ? {
            title: contextDream.title,
            description: stripHtml(contextDream.description),
            tags: contextDream.tags,
            createdAt: contextDream.createdAt,
          }
        : undefined,
      allDreams: allDreams.map(d => ({
        date: toDateKey(new Date(d.createdAt)),
        title: d.title,
        tags: d.tags,
        summary: stripHtml(d.description).slice(0, 300),
      })),
    },
    onFinish: async (message) => {
      await saveChatMessage('assistant', message.content, contextDream?.id)
    },
  })

  useEffect(() => {
    Promise.all([getChatMessages(), getDreams()]).then(([stored, dreams]) => {
      setAllDreams(dreams)
      if (stored.length > 0) {
        setMessages(
          stored.map(m => ({ id: m.id, role: m.role, content: m.content }))
        )
      }
      setHistoryLoaded(true)
    })
  }, [setMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function onSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!input.trim()) return
    await saveChatMessage('user', input.trim(), contextDream?.id)
    handleSubmit(e as React.FormEvent<HTMLFormElement>)
  }

  const displayInput = mic.isListening
    ? (input ? input + ' ' : '') + (mic.interim || '')
    : input

  return (
    <div className="min-h-screen flex flex-col max-w-[600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/18 transition-all active:scale-95"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="font-display text-white text-lg leading-tight">Carl Jung</p>
          <p className="font-ui text-white/40 text-xs">Znawca snów i nieświadomości</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#533483] to-[#2d1a4a] flex items-center justify-center text-sm font-display text-white/80">
          CJ
        </div>
      </div>

      {/* Context badge */}
      {contextDream && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10">
          <span className="font-ui text-white/50 text-xs">Rozmawiamy o:</span>
          <span className="font-ui text-white/80 text-xs flex-1 truncate">
            {contextDream.title || toDateKey(new Date(contextDream.createdAt))}
          </span>
          <button
            onClick={() => setContextDream(undefined)}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {historyLoaded && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#533483] to-[#2d1a4a] flex items-center justify-center text-2xl font-display text-white/80 mb-4">
              CJ
            </div>
            <p className="font-display text-white text-xl mb-2">Witaj w gabinecie</p>
            <p className="font-ui text-white/45 text-sm max-w-[260px] leading-relaxed">
              Jestem Carl Jung. Opowiedz mi o swoich snach — razem odkryjemy, co skrywa twoja nieświadomość.
            </p>
          </div>
        )}

        {messages.map(m => (
          <ChatMessage key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#533483] to-[#2d1a4a] flex items-center justify-center shrink-0 mr-2 mt-0.5 text-xs font-display text-white/80">
              CJ
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-white/10">
        <form onSubmit={onSend} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Zapytaj Junga…"
              value={displayInput}
              onChange={e => { if (!mic.isListening) setInput(e.target.value) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) onSend() }}
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
                    mic.start(text => setInput(prev => (prev ? prev + ' ' : '') + text))
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
            type="submit"
            disabled={!input.trim() || isLoading}
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
        </form>
      </div>
    </div>
  )
}
