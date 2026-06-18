import { useId } from 'react'

function Sparkle({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const i = r * 0.18
  return (
    <path
      d={`M ${cx} ${cy - r}
          L ${cx + i} ${cy - i}
          L ${cx + r} ${cy}
          L ${cx + i} ${cy + i}
          L ${cx} ${cy + r}
          L ${cx - i} ${cy + i}
          L ${cx - r} ${cy}
          L ${cx - i} ${cy - i}
          Z`}
      fill="white"
    />
  )
}

export function MoonIcon({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const maskId = `moon-mask-${id}`
  return (
    <svg
      viewBox="0 0 200 200"
      aria-label="Księżyc"
      className={className}
      style={{ filter: 'drop-shadow(0 4px 24px rgba(100,70,160,0.18))' }}
    >
      <defs>
        <mask id={maskId}>
          <rect width="200" height="200" fill="white" />
          <circle cx="130" cy="90" r="72" fill="black" />
        </mask>
      </defs>
      <g opacity="0.9">
        <circle cx="100" cy="100" r="80" fill="white" mask={`url(#${maskId})`} />
      </g>
      <g opacity="0.92">
        <Sparkle cx={148} cy={133} r={18} />
        <Sparkle cx={126} cy={102} r={10} />
        <Sparkle cx={164} cy={168} r={7}  />
        <Sparkle cx={88}  cy={140} r={8}  />
      </g>
    </svg>
  )
}
