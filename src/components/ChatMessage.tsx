import { UIMessage } from 'ai'
import { cn } from '@/lib/utils'

type Props = {
  message: UIMessage
}

export function ChatMessage({ message }: Props) {
  const { role } = message
  const content = message.parts
    .filter(p => p.type === 'text')
    .map(p => (p as { type: 'text'; text: string }).text)
    .join('')
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mr-3 mt-2.5" />
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
