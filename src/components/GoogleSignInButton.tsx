import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (element: HTMLElement, config: object) => void
        }
      }
    }
  }
}

export function GoogleSignInButton() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
    if (!clientId || !window.google) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }: { credential: string }) => {
        await supabase.auth.signInWithIdToken({ provider: 'google', token: credential })
      },
    })

    if (ref.current) {
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard',
        shape: 'pill',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        locale: 'pl',
        width: ref.current.offsetWidth || 320,
      })
    }
  }, [])

  return <div ref={ref} className="w-full flex justify-center" />
}
