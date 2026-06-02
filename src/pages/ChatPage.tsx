import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Mic, SendHorizonal, X } from 'lucide-react'
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
  const location = useLocation()
  const mic = useSpeechRecognition()

  const passedDream = (location.state as { currentDream?: CurrentDream } | null)?.currentDream
  const [contextDream, setContextDream] = useState<CurrentDream | undefined>(passedDream)
  const [allDreams, setAllDreams] = useState<Dream[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Keep a ref to current context so the transport always sends up-to-date values
  const contextRef = useRef({ contextDream, allDreams })
  useEffect(() => { contextRef.current = { contextDream, allDreams } }, [contextDream, allDreams])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${SUPABASE_URL}/functions/v1/jung-chat`,
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        prepareSendMessagesRequest: async (opts) => {
          const { contextDream: cd, allDreams: ad } = contextRef.current
          return {
            ...opts,
            body: {
              ...(opts.body as object),
              messages: opts.messages,
              currentDream: cd
                ? {
                    title: cd.title,
                    description: stripHtml(cd.description),
                    tags: cd.tags,
                    createdAt: cd.createdAt,
                  }
                : undefined,
              allDreams: ad.map(d => ({
                date: toDateKey(new Date(d.createdAt)),
                title: d.title,
                tags: d.tags,
                summary: stripHtml(d.description).slice(0, 300),
              })),
            },
          }
        },
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onFinish: async ({ message }) => {
      const text = message.parts
        .filter(p => p.type === 'text')
        .map(p => (p as { type: 'text'; text: string }).text)
        .join('')
      await saveChatMessage('assistant', text, contextDream?.id)
    },
  })

  useEffect(() => {
    Promise.all([getChatMessages(), getDreams()]).then(([stored, dreams]) => {
      setAllDreams(dreams)
      if (stored.length > 0) {
        setMessages(
          stored.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: m.content }],
          }))
        )
      }
      setHistoryLoaded(true)
    })
  }, [setMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function onSend() {
    const text = inputValue.trim()
    if (!text || status === 'submitted' || status === 'streaming') return
    setInputValue('')
    await saveChatMessage('user', text, contextDream?.id)
    sendMessage({ text })
  }

  const isLoading = status === 'submitted' || status === 'streaming'

  const displayInput = mic.isListening
    ? (inputValue ? inputValue + ' ' : '') + (mic.interim || '')
    : inputValue

  return (
    <div className="min-h-screen flex flex-col max-w-[600px] mx-auto">
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
        {messages.map(m => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start items-start">
            <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mr-3 mt-2.5" />
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
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={messages.length > 0 ? 'Zapytaj znawcę snów…' : 'Zapytaj Junga…'}
              value={displayInput}
              onChange={e => { if (!mic.isListening) setInputValue(e.target.value) }}
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
                    mic.start(text => setInputValue(prev => (prev ? prev + ' ' : '') + text))
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
            onClick={onSend}
            disabled={!inputValue.trim() || isLoading}
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
    </div>
  )
}
