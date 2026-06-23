import { X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export type TherapistId = 'jung' | 'neurobiolog' | 'wrozbit'

export interface Therapist {
  id: TherapistId
  name: string
  tag?: string
  price?: string
  stripeUrl?: string
}

export const THERAPISTS: Therapist[] = [
  { id: 'jung', name: 'Carl Jung', tag: 'default' },
  { id: 'neurobiolog', name: 'Neurobiolog snu', price: '5 zł', stripeUrl: 'https://buy.stripe.com/test_28E6oI3nk5vq3GdgdV1RC00' },
  { id: 'wrozbit', name: 'Wróżbita Maciej', price: '5 zł', stripeUrl: 'https://buy.stripe.com/test_8x24gA3nkcXS1y5f9R1RC01' },
]

interface TherapistPickerProps {
  open: boolean
  selected: TherapistId
  purchased?: TherapistId[]
  onSelect: (id: TherapistId) => void
  onClose: () => void
}

export function TherapistPicker({ open, selected, purchased = [], onSelect, onClose }: TherapistPickerProps) {
  if (!open) return null

  const { user } = useAuth()

  const isUnlocked = (id: TherapistId) => id === 'jung' || purchased.includes(id)

  // Doklejamy client_reference_id (user_id) do URL Payment Linka,
  // żeby webhook Stripe wiedział, któremu użytkownikowi przyznać dostęp.
  function buildStripeUrl(baseUrl: string): string {
    if (!user) return baseUrl
    const url = new URL(baseUrl)
    url.searchParams.set('client_reference_id', user.id)
    return url.toString()
  }

  const handleRowClick = (id: TherapistId) => {
    if (!isUnlocked(id)) return
    onSelect(id)
  }

  const content = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <p className="font-display text-white text-lg font-semibold">Wybierz przewodnika</p>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150 active:scale-95"
        >
          <X size={16} />
        </button>
      </div>

      {THERAPISTS.map(t => {
        const isSelected = selected === t.id
        const unlocked = isUnlocked(t.id)
        return (
          <div
            key={t.id}
            onClick={() => handleRowClick(t.id)}
            className={[
              'flex items-center justify-between px-4 h-14 rounded-2xl border transition-all duration-150',
              isSelected
                ? 'border-violet-400/60 bg-violet-400/15'
                : unlocked
                ? 'border-white/15 bg-white/[0.04] hover:bg-white/10 cursor-pointer'
                : 'border-white/15 bg-white/[0.04]',
            ].join(' ')}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Radio dot */}
              <div
                className={[
                  'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150',
                  isSelected
                    ? 'border-violet-400 bg-violet-400'
                    : unlocked
                    ? 'border-white/30'
                    : 'border-white/15',
                ].join(' ')}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <span className={[
                'font-ui text-sm font-medium truncate',
                unlocked ? 'text-white' : 'text-white/35',
              ].join(' ')}>{t.name}</span>

              {t.tag && (
                <span className="font-ui text-[0.6rem] tracking-widest uppercase text-white/40 border border-white/20 rounded-full px-2 py-0.5 shrink-0">
                  {t.tag}
                </span>
              )}
            </div>

            {/* Right side: unlock button only for locked therapists */}
            {!unlocked && t.price && t.stripeUrl && (
              <a
                href={buildStripeUrl(t.stripeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="font-ui ml-3 shrink-0 px-4 h-8 rounded-full text-sm font-medium
                           bg-violet-500 hover:bg-violet-400 text-white
                           transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
              >
                Odblokuj: {t.price}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Mobile: bottom drawer */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 p-5 pb-10"
        style={{ background: '#3D4254' }}
      >
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {content}
      </div>

      {/* Desktop: centered modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md mx-4 rounded-3xl border border-white/15 p-6"
          style={{
            background: 'rgba(61,66,84,0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          {content}
        </div>
      </div>
    </>
  )
}
