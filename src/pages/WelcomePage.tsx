import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function WelcomePage() {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('userName')) {
      navigate('/home', { replace: true })
    }
  }, [])

  function handleStart() {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem('userName', trimmed)
    navigate('/home')
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Tytuł i podtytuł */}
      <div className="pt-16 px-8 text-center">
        <h1 className="font-display text-[#2d2440] text-4xl mb-3">
          Łapacz snów
        </h1>
        <p className="font-ui text-[#6b5f80] text-base font-light">
          Miejsce na sny, które warto zapamiętać.
        </p>
      </div>

      {/* Ikona łapacza snów — centrum ekranu */}
      <div className="flex-1 flex items-center justify-center py-4">
        <DreamcatcherIcon />
      </div>

      {/* Pole na imię */}
      <div className="px-8 pb-6">
        <p className="font-ui text-[#2d2440] text-base mb-2">
          Czyje sny będziemy łapać?
        </p>
        <input
          type="text"
          placeholder="Twoje imię"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          className="w-full border border-[#d1c9e0] rounded-xl px-4 py-3 font-ui text-[#2d2440] placeholder-[#b0a8c0] bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#7c6fa0]"
        />
      </div>

      {/* Baton — pełna szerokość, przyklejony do dołu */}
      <div className="p-4 pb-8 bg-gradient-to-t from-[#f0e8ff]/80 to-transparent">
        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className="w-full h-14 rounded-full
                     bg-gradient-to-r from-[#533483] to-[#6a44a0]
                     text-white font-ui font-medium text-[0.95rem] tracking-wide
                     flex items-center justify-center
                     shadow-lg shadow-purple-900/50
                     hover:from-[#6a44a0] hover:to-[#7d55b8]
                     active:scale-[0.98] transition-all duration-150
                     disabled:opacity-40"
        >
          Zaczynajmy!
        </button>
      </div>
    </div>
  )
}

/* ── Łapacz snów SVG ────────────────────────────────────────── */

function DreamcatcherIcon() {
  // Centrum obręczy
  const cx = 100, cy = 100
  const R = 80     // promień środkowy obręczy
  const hw = 10    // grubość obręczy
  const webR = 70  // promień zewnętrznego pierścienia sieci (wewnętrzna krawędź obręczy)

  // 9 punktów na zewnętrznym pierścieniu sieci
  const N = 9
  const outer = Array.from({ length: N }, (_, i) => {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / N
    return { x: cx + webR * Math.cos(a), y: cy + webR * Math.sin(a) }
  })

  // Środkowy pierścień sieci (r=43, przesunięty o pół kroku)
  const midR = 43
  const mid = Array.from({ length: N }, (_, i) => {
    const a = (-Math.PI / 2) + ((i + 0.5) * 2 * Math.PI) / N
    return { x: cx + midR * Math.cos(a), y: cy + midR * Math.sin(a) }
  })

  // Linie sieci: co 4 (9-ramienna gwiazda odwiedzająca wszystkie punkty)
  const lines4 = outer.map((_, i) => {
    const a = outer[i], b = outer[(i + 4) % N]
    return `M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}`
  }).join(' ')

  // Linie sieci: co 3 (3 trójkąty)
  const lines3 = outer.map((_, i) => {
    const a = outer[i], b = outer[(i + 3) % N]
    return `M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}`
  }).join(' ')

  // Linie sieci: co 2 (kolejna 9-gwiazda)
  const lines2 = outer.map((_, i) => {
    const a = outer[i], b = outer[(i + 2) % N]
    return `M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}`
  }).join(' ')

  // Gwiazda środkowego pierścienia
  const midLines = mid.map((_, i) => {
    const a = mid[i], b = mid[(i + 4) % N]
    return `M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}`
  }).join(' ')

  // Punkty zawieszenia piór (na dolnym łuku obręczy)
  const hangX = [65, 81, 100, 119, 135]
  const attach = hangX.map(x => {
    const cosA = (x - cx) / R
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA))
    return { x, y: cy + R * sinA }
  })

  return (
    <svg
      viewBox="0 0 200 375"
      width="190"
      height="356"
      aria-label="Łapacz snów"
      style={{ filter: 'drop-shadow(0 4px 24px rgba(100,70,160,0.18))' }}
    >
      {/* ── Obręcz ── */}
      <circle cx={cx} cy={cy} r={R} stroke="white" strokeWidth={hw} fill="none" />

      {/* ── Sieć ── */}
      <g stroke="white" strokeWidth="1.3" fill="none">
        <path d={lines4} />
        <path d={lines3} />
        <path d={lines2} />
      </g>

      {/* Środkowy pierścień sieci */}
      <circle cx={cx} cy={cy} r={midR} stroke="white" strokeWidth="1" fill="none" />
      <path d={midLines} stroke="white" strokeWidth="1" fill="none" />

      {/* Wewnętrzny okrąg */}
      <circle cx={cx} cy={cy} r={19} stroke="white" strokeWidth="1.5" fill="none" />

      {/* Koraliki na zewnętrznym pierścieniu */}
      {outer.map((p, i) => (
        <circle key={`ob${i}`} cx={f(p.x)} cy={f(p.y)} r={3.5} fill="white" />
      ))}

      {/* Koraliki na środkowym pierścieniu */}
      {mid.map((p, i) => (
        <circle key={`mb${i}`} cx={f(p.x)} cy={f(p.y)} r={2.2} fill="white" />
      ))}

      {/* ── Nitki i ozdoby ── */}

      {/* Lewa nitka: kółko + duże pióro */}
      <line x1={attach[0].x} y1={f(attach[0].y)} x2="65" y2="190" stroke="white" strokeWidth="1.2" />
      <circle cx="65" cy="196" r="6" stroke="white" strokeWidth="2" fill="none" />
      <line x1="65" y1="202" x2="65" y2="214" stroke="white" strokeWidth="1.2" />
      {/* Duże pióro lewe */}
      <path d="M65,214 C80,228 83,256 70,284 C65,293 56,297 53,294 C40,287 38,256 52,230 C57,223 62,217 65,214 Z"
        fill="white" />

      {/* Lewa-środkowa nitka: gwiazda + koralik + małe pióro */}
      <line x1={attach[1].x} y1={f(attach[1].y)} x2="81" y2="196" stroke="white" strokeWidth="1.2" />
      <Star cx={81} cy={205} outerR={8} innerR={4} />
      <line x1="81" y1="214" x2="81" y2="227" stroke="white" strokeWidth="1.2" />
      <circle cx="81" cy="231" r="3.5" fill="white" />
      <line x1="81" y1="235" x2="81" y2="246" stroke="white" strokeWidth="1.2" />
      {/* Małe pióro lewe-środkowe */}
      <path d="M81,246 C90,256 91,273 83,291 C80,297 74,300 72,298 C63,291 64,267 73,251 C76,248 79,247 81,246 Z"
        fill="white" />

      {/* Środkowa nitka: koralik + największe pióro */}
      <line x1="100" y1={f(attach[2].y)} x2="100" y2="200" stroke="white" strokeWidth="1.2" />
      <circle cx="100" cy="206" r="5" fill="white" />
      <line x1="100" y1="211" x2="100" y2="228" stroke="white" strokeWidth="1.2" />
      {/* Duże środkowe pióro */}
      <path d="M100,228 C118,246 121,283 112,318 C108,337 103,352 100,357 C97,352 92,337 88,318 C79,283 82,246 100,228 Z"
        fill="white" />
      {/* Ozdoba na dole środkowego pióra */}
      <line x1="100" y1="357" x2="100" y2="362" stroke="white" strokeWidth="2" />
      <ellipse cx="100" cy="367" rx="5" ry="7" fill="white" />

      {/* Prawa-środkowa nitka: gwiazda + koralik + małe pióro (lustro lewej-środkowej) */}
      <line x1={attach[3].x} y1={f(attach[3].y)} x2="119" y2="196" stroke="white" strokeWidth="1.2" />
      <Star cx={119} cy={205} outerR={8} innerR={4} />
      <line x1="119" y1="214" x2="119" y2="227" stroke="white" strokeWidth="1.2" />
      <circle cx="119" cy="231" r="3.5" fill="white" />
      <line x1="119" y1="235" x2="119" y2="246" stroke="white" strokeWidth="1.2" />
      {/* Małe pióro prawe-środkowe */}
      <path d="M119,246 C110,256 109,273 117,291 C120,297 126,300 128,298 C137,291 136,267 127,251 C124,248 121,247 119,246 Z"
        fill="white" />

      {/* Prawa nitka: kółko + duże pióro (lustro lewej) */}
      <line x1={attach[4].x} y1={f(attach[4].y)} x2="135" y2="190" stroke="white" strokeWidth="1.2" />
      <circle cx="135" cy="196" r="6" stroke="white" strokeWidth="2" fill="none" />
      <line x1="135" y1="202" x2="135" y2="214" stroke="white" strokeWidth="1.2" />
      {/* Duże pióro prawe */}
      <path d="M135,214 C120,228 117,256 130,284 C135,293 144,297 147,294 C160,287 162,256 148,230 C143,223 138,217 135,214 Z"
        fill="white" />
    </svg>
  )
}

/* ── Gwiazda 6-ramienna ────────────────────────────────────── */
function Star({ cx, cy, outerR, innerR }: { cx: number; cy: number; outerR: number; innerR: number }) {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const aOuter = (-Math.PI / 2) + (i * 2 * Math.PI) / 6
    const aInner = aOuter + Math.PI / 6
    pts.push(`${f(cx + outerR * Math.cos(aOuter))},${f(cy + outerR * Math.sin(aOuter))}`)
    pts.push(`${f(cx + innerR * Math.cos(aInner))},${f(cy + innerR * Math.sin(aInner))}`)
  }
  return <polygon points={pts.join(' ')} stroke="white" strokeWidth="1.2" fill="none" />
}

function f(n: number) {
  return Math.round(n * 10) / 10
}
