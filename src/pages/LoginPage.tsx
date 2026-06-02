import { MoonIcon } from '@/components/MoonIcon'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'

export function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-10">
        <div className="flex flex-col items-center gap-3">
          <MoonIcon className="w-16 h-16 text-white/80" />
          <h1 className="font-display text-white text-4xl text-center">Dziennik Snów</h1>
        </div>

        <GoogleSignInButton />
      </div>
    </div>
  )
}
