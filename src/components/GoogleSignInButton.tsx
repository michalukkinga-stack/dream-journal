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

function initButton(clientId: string, element: HTMLElement) {
  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: async ({ credential }: { credential: string }) => {
      await supabase.auth.signInWithIdToken({ provider: 'google', token: credential })
    },
  })
  window.google!.accounts.id.renderButton(element, {
    type: 'standard',
    shape: 'pill',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    locale: 'pl',
    width: element.offsetWidth || 320,
  })
}

export function GoogleSignInButton() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
    if (!clientId || !ref.current) return

    if (window.google) {
      // skrypt już załadowany
      initButton(clientId, ref.current)
    } else {
      // poczekaj aż skrypt się załaduje
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement | null
      if (script) {
        script.addEventListener('load', () => {
          if (ref.current) initButton(clientId, ref.current)
        })
      }
    }
  }, [])

  return <div ref={ref} className="w-full flex justify-center" />
}
