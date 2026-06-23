import { ChevronDown, ChevronUp } from 'lucide-react'
import { ChatPanel, ChatPanelHandle } from '@/components/ChatPanel'
import { THERAPISTS } from '@/components/TherapistPicker'
import { Dream } from '@/types/dream'
import { forwardRef, useRef } from 'react'

interface ChatBottomSheetProps {
  open: boolean
  onToggle: () => void
  currentDream?: Dream
  allDreams: Dream[]
  selectedDate: string
  showStrip?: boolean
  persona?: string
}

// Wysokość AgentInput (pb-8 + pt-3 + input ~44px) ≈ 88px = 5.5rem
const INPUT_BAR_HEIGHT = '5.5rem'
// Wysokość zwiniętego handlera
const HANDLE_HEIGHT = '2.5rem'

export const ChatBottomSheet = forwardRef<ChatPanelHandle, ChatBottomSheetProps>(
  ({ open, onToggle, currentDream, allDreams, selectedDate, showStrip = false, persona }, ref) => {
    const panelRef = useRef<ChatPanelHandle>(null)
    const resolvedRef = (ref as React.RefObject<ChatPanelHandle>) ?? panelRef

    return (
      <>
        {/* Backdrop — tylko gdy otwarty */}
        {open && <div className="fixed inset-0 z-40" onClick={onToggle} />}

        {/* Sheet — pozycjonowany tuż nad inputem */}
        <div
          className="fixed left-0 right-0 z-50 max-w-[600px] md:max-w-none mx-auto md:mx-0 md:w-auto flex flex-col rounded-t-2xl transition-transform duration-300 ease-in-out overflow-hidden bottom-[5.5rem] md:bottom-[72px] md:left-[calc(280px+1rem)] md:right-4"
          style={{
            height: '67vh',
            transform: open
              ? 'translateY(0)'
              : showStrip
              ? 'translateY(calc(100% - 3.125rem))'
              : 'translateY(calc(100% + 200px))',
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
          <div
            className="shrink-0 h-10 w-full flex items-center justify-between px-5 cursor-pointer"
            onClick={!open ? onToggle : undefined}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-display text-white text-base font-semibold tracking-wide">
                Analiza snu
              </span>
              <span className="font-display text-white/40 text-sm tracking-wide" style={{ fontWeight: 400 }}>
                Przewodnik: {THERAPISTS.find(t => t.id === persona)?.name ?? 'Carl Jung'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-white/50 hover:text-white/80 hover:bg-white/10
                         transition-all duration-150 active:scale-95"
            >
              {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>

          {/* Divider */}
          <div className={`mx-5 border-t border-white/10 shrink-0 ${open ? '' : 'hidden'}`} />

          {/* Wiadomości — zawsze zamontowane, żeby ref był dostępny od razu */}
          <div className={`flex-1 overflow-y-auto px-5 pb-3 ${open ? '' : 'hidden'}`}>
            <ChatPanel
              ref={resolvedRef}
              currentDream={currentDream}
              allDreams={allDreams}
              selectedDate={selectedDate}
              persona={persona}
            />
          </div>
        </div>
      </>
    )
  }
)

ChatBottomSheet.displayName = 'ChatBottomSheet'
