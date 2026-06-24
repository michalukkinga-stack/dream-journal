import { MoonIcon } from '@/components/MoonIcon'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { ConstellationBackground } from '@/components/ConstellationBackground'

function SparkleI() {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {'ı'}
      <svg
        viewBox="0 0 10 10"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 'calc(-0.38em + 5px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0.470em',
          height: '0.470em',
        }}
      >
        <path
          d="M 5 0 L 5.9 4.1 L 10 5 L 5.9 5.9 L 5 10 L 4.1 5.9 L 0 5 L 4.1 4.1 Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

export function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 relative">
      <ConstellationBackground forceMobile />
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative" style={{ zIndex: 1 }}>
        <div className="flex flex-col items-center gap-3 translate-y-20">
          <MoonIcon className="w-32 h-32 text-[#533483]/70 opacity-60" />
          <h1 className="font-display text-white/80 text-4xl text-center">
            Dz<SparkleI />ennik Snów
          </h1>
        </div>
      </div>

      <div className="w-full max-w-sm relative pb-5" style={{ zIndex: 1 }}>
        <GoogleSignInButton />
      </div>
    </div>
  )
}
