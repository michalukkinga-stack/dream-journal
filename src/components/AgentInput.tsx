import { useNavigate } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { Dream } from '@/types/dream'

type Props = {
  currentDream?: Dream
}

export function AgentInput({ currentDream }: Props) {
  const navigate = useNavigate()

  function openChat() {
    navigate('/chat', { state: { currentDream } })
  }

  return (
    <div className="shrink-0 px-4 pb-8 pt-3 border-t border-white/10 bg-transparent">
      <button
        type="button"
        onClick={openChat}
        className="w-full flex items-center gap-2"
      >
        <div className="relative flex-1">
          <div
            className="w-full border border-white/20 rounded-xl px-4 py-3 font-ui text-white/35
                       bg-white/10 backdrop-blur-sm text-left text-sm"
          >
            Zapytaj o swój sen…
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                          flex items-center justify-center text-white/40">
            <Mic size={14} />
          </div>
        </div>
      </button>
    </div>
  )
}
