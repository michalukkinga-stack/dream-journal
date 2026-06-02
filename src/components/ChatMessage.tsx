import { cn } from '@/lib/utils'

type Props = {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#533483] to-[#2d1a4a] flex items-center justify-center shrink-0 mr-2 mt-0.5 text-xs font-display text-white/80">
          CJ
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 font-ui text-sm font-light leading-relaxed',
          isUser
            ? 'bg-gradient-to-br from-[#533483] to-[#6a44a0] text-white rounded-br-sm'
            : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-sm'
        )}
      >
        {content}
      </div>
    </div>
  )
}
