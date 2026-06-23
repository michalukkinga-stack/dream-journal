import { useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { getChatMessages, saveChatMessage } from '@/storage/chatStorage'
import { stripHtml } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'
import { toDateKey } from '@/components/CalendarStrip'
import { ChatMessage } from '@/components/ChatMessage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface ChatPanelProps {
  currentDream?: Dream
  allDreams: Dream[]
  selectedDate: string
  persona?: string
}

export interface ChatPanelHandle {
  sendMessage: (text: string) => void
  isLoading: boolean
}

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(
  ({ currentDream, allDreams, selectedDate, persona = 'jung' }, ref) => {
    const bottomRef = useRef<HTMLDivElement>(null)

    const contextRef = useRef({ currentDream, allDreams, persona })
    useEffect(() => { contextRef.current = { currentDream, allDreams, persona } }, [currentDream, allDreams, persona])

    const transport = useMemo(
      () =>
        new DefaultChatTransport({
          api: `${SUPABASE_URL}/functions/v1/jung-chat`,
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          prepareSendMessagesRequest: async (opts) => {
            const { currentDream: cd, allDreams: ad, persona: p } = contextRef.current
            return {
              ...opts,
              body: {
                ...(opts.body as object),
                messages: opts.messages,
                persona: p,
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
        await saveChatMessage('assistant', text, selectedDate, currentDream?.id)
      },
    })

    useEffect(() => {
      getChatMessages(selectedDate).then(stored => {
        setMessages(
          stored.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: m.content }],
          }))
        )
      })
    }, [selectedDate, setMessages])

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const isLoading = status === 'submitted' || status === 'streaming'

    useImperativeHandle(ref, () => ({
      isLoading,
      sendMessage: async (text: string) => {
        await saveChatMessage('user', text, selectedDate, currentDream?.id)
        sendMessage({ text })
      },
    }))

    if (messages.length === 0 && !isLoading) return null

    return (
      <div className="flex flex-col gap-3 py-3">
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
    )
  }
)

ChatPanel.displayName = 'ChatPanel'
