import { ChevronDown, ChevronUp } from 'lucide-react'
import { ChatPanel, ChatPanelHandle } from '@/components/ChatPanel'
import { Dream } from '@/types/dream'
import { forwardRef, useRef } from 'react'

interface ChatBottomSheetProps {
  open: boolean
  onToggle: () => void
  currentDream?: Dream
  allDreams: Dream[]
  selectedDate: string
  showStrip?: boolean
}

// Wysokość AgentInput (pb-8 + pt-3 + input ~44px) ≈ 88px = 5.5rem
const INPUT_BAR_HEIGHT = '5.5rem'
// Wysokość zwiniętego handlera
const HANDLE_HEIGHT = '2.5rem'

export const ChatBottomSheet = forwardRef<ChatPanelHandle, ChatBottomSheetProps>(
  ({ open, onToggle, currentDream, allDreams, selectedDate, showStrip = false }, ref) => {
    const panelRef = useRef<ChatPanelHandle>(null)
    const resolvedRef = (ref as React.RefObject<ChatPanelHandle>) ?? panelRef

    // Gdy nie ma rozmowy i panel zamknięty — schowany daleko poza ekranem (ref nadal działa)
    const hidden = !open && !showStrip

    return (
      <>
        {/* Backdrop — tylko gdy otwarty */}
        {open && <div className="fixed inset-0 z-40" onClick={onToggle} />}

        {/* Sheet — pozycjonowany tuż nad inputem */}
        <div
          className="fixed left-0 right-0 z-50 max-w-[600px] mx-auto flex flex-col rounded-t-2xl transition-transform duration-300 ease-in-out overflow-hidden bottom-[5.5rem] md:bottom-24"
          style={{
            height: '67vh',
            transform: hidden
              ? 'translateY(100%)'
              : open
                ? 'translateY(0)'
                : `translateY(calc(100% - ${HANDLE_HEIGHT}))`,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            borderBottom: 'none',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {/* Handle strip */}
          <div className="shrink-0 h-10 w-full flex items-center justify-between px-5">
            <span className="font-display text-white text-base font-semibold tracking-wide">
              Analiza snu
            </span>
            <button
              type="button"
              onClick={onToggle}
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-white/50 hover:text-white/80 hover:bg-white/10
                         transition-all duration-150 active:scale-95"
            >
              {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-white/10 shrink-0" />

          {/* Wiadomości */}
          <div className="flex-1 overflow-y-auto px-5 pb-3">
            <ChatPanel
              ref={resolvedRef}
              currentDream={currentDream}
              allDreams={allDreams}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </>
    )
  }
)

ChatBottomSheet.displayName = 'ChatBottomSheet'
