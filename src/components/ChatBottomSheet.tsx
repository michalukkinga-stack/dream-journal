import { ChevronDown } from 'lucide-react'
import { ChatPanel, ChatPanelHandle } from '@/components/ChatPanel'
import { AgentInput } from '@/components/AgentInput'
import { Dream } from '@/types/dream'
import { forwardRef, useRef } from 'react'

interface ChatBottomSheetProps {
  open: boolean
  onClose: () => void
  currentDream?: Dream
  allDreams: Dream[]
}

export const ChatBottomSheet = forwardRef<ChatPanelHandle, ChatBottomSheetProps>(
  ({ open, onClose, currentDream, allDreams }, ref) => {
    const panelRef = useRef<ChatPanelHandle>(null)

    // Expose the inner panel via forwarded ref
    const resolvedRef = (ref as React.RefObject<ChatPanelHandle>) ?? panelRef

    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
        )}

        {/* Sheet */}
        <div
          className={[
            'fixed left-0 right-0 bottom-0 z-50 max-w-[600px] mx-auto',
            'flex flex-col rounded-t-3xl',
            'transition-transform duration-300 ease-in-out',
            open ? 'translate-y-0' : 'translate-y-full',
          ].join(' ')}
          style={{
            height: '67vh',
            background: 'linear-gradient(170deg, #3D4254 0%, #7A465B 50%, #16323F 100%)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <span className="font-display text-white text-lg font-semibold tracking-wide">
              Analiza snu
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full
                         text-white/50 hover:text-white hover:bg-white/10
                         transition-all duration-150 active:scale-95"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-white/10 shrink-0" />

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-5">
            <ChatPanel
              ref={resolvedRef}
              currentDream={currentDream}
              allDreams={allDreams}
            />
          </div>

          {/* Input bar */}
          <AgentInput
            onSend={(text) => resolvedRef.current?.sendMessage(text)}
            isLoading={resolvedRef.current?.isLoading ?? false}
          />
        </div>
      </>
    )
  }
)

ChatBottomSheet.displayName = 'ChatBottomSheet'
