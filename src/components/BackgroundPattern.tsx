import React from 'react'

/* ── helpers ─────────────────────────────────────────────────── */

function star8Path(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    const rd = i % 2 === 0 ? R : r
    pts.push(
      `${+(cx + rd * Math.cos(a)).toFixed(2)},${+(cy + rd * Math.sin(a)).toFixed(2)}`
    )
  }
  return `M ${pts.join(' L ')} Z`
}

// Crescent (C-shape at origin, rotated via transform)
// R = outer radius, inner ≈ 0.8R, opening on the right by default
function Moon({ cx, cy, R, deg }: { cx: number; cy: number; R: number; deg: number }) {
  const rx = +(0.75 * R).toFixed(2)
  const ry = +(0.661 * R).toFixed(2)
  const ir = +(0.8 * R).toFixed(2)
  const d = `M ${rx},-${ry} A ${R},${R} 0 1,0 ${rx},${ry} A ${ir},${ir} 0 0,1 ${rx},-${ry} Z`
  return <path d={d} transform={`translate(${cx},${cy}) rotate(${deg})`} />
}

function S8({ cx, cy, R, r }: { cx: number; cy: number; R: number; r: number }) {
  return <path d={star8Path(cx, cy, R, r)} />
}

/* ── component ───────────────────────────────────────────────── */

export function BackgroundPattern() {
  const SX = 195, SY = 505, SR = 70   // sun centre + radius

  /* Sun rays — 16 total, alternating straight / wavy (cubic bezier) */
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a  = (i / 16) * Math.PI * 2 - Math.PI / 2
    const c  = Math.cos(a), s = Math.sin(a)
    const x1 = +(SX + (SR + 6) * c).toFixed(2)
    const y1 = +(SY + (SR + 6) * s).toFixed(2)

    if (i % 2 === 0) {
      // straight ray
      const x2 = +(SX + 194 * c).toFixed(2)
      const y2 = +(SY + 194 * s).toFixed(2)
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
    } else {
      // wavy ray
      const inner = SR + 6, outer = 170, len = outer - inner
      const px = -s, py = c          // perpendicular direction
      const amp = 9
      const cx1 = +(SX + (inner + len * 0.33) * c + amp * px).toFixed(2)
      const cy1 = +(SY + (inner + len * 0.33) * s + amp * py).toFixed(2)
      const cx2 = +(SX + (inner + len * 0.66) * c - amp * px).toFixed(2)
      const cy2 = +(SY + (inner + len * 0.66) * s - amp * py).toFixed(2)
      const x2  = +(SX + outer * c).toFixed(2)
      const y2  = +(SY + outer * s).toFixed(2)
      return (
        <path key={i}
          d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
        />
      )
    }
  })

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
      style={{ zIndex: 0 }}
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="white" fill="none" strokeWidth={0.85} opacity={0.17}>

        {/* ── OUTER FRAME ─────────────────────────────────────── */}
        <rect x="20" y="20" width="350" height="804" rx="7" />

        {/* Corner circles + inner 8-pt star */}
        {([[20,20],[370,20],[20,824],[370,824]] as [number,number][]).map(([cx,cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={18} />
            <S8 cx={cx} cy={cy} R={9} r={3.5} />
          </g>
        ))}

        {/* ── TOP CENTRE ORNAMENT ─────────────────────────────── */}
        {/* chevrons */}
        <path d="M 147,40 L 158,32 L 169,40" strokeLinejoin="round" />
        <path d="M 221,40 L 232,32 L 243,40" strokeLinejoin="round" />
        {/* decorative dots + small sun/moons  */}
        <circle cx="180" cy="36" r="1.6" fill="white" stroke="none" />
        <circle cx="188" cy="33" r="2.2" />
        <circle cx="195" cy="30" r="3.8" />
        <circle cx="202" cy="33" r="2.2" />
        <circle cx="210" cy="36" r="1.6" fill="white" stroke="none" />

        {/* ── BOTTOM CENTRE ORNAMENT (mirror) ─────────────────── */}
        <path d="M 147,804 L 158,812 L 169,804" strokeLinejoin="round" />
        <path d="M 221,804 L 232,812 L 243,804" strokeLinejoin="round" />
        <circle cx="180" cy="808" r="1.6" fill="white" stroke="none" />
        <circle cx="188" cy="811" r="2.2" />
        <circle cx="195" cy="814" r="3.8" />
        <circle cx="202" cy="811" r="2.2" />
        <circle cx="210" cy="808" r="1.6" fill="white" stroke="none" />

        {/* Side mid dots */}
        <circle cx="20"  cy="422" r="4" />
        <circle cx="20"  cy="410" r="1.8" fill="white" stroke="none" />
        <circle cx="20"  cy="434" r="1.8" fill="white" stroke="none" />
        <circle cx="370" cy="422" r="4" />
        <circle cx="370" cy="410" r="1.8" fill="white" stroke="none" />
        <circle cx="370" cy="434" r="1.8" fill="white" stroke="none" />

        {/* ── SUN ─────────────────────────────────────────────── */}
        <circle cx={SX} cy={SY} r={SR} />
        {rays}

        {/* Sun face — left eye */}
        <ellipse cx={SX - 17} cy={SY - 11} rx={5.5} ry={3.5} />
        <circle  cx={SX - 17} cy={SY - 11} r={1.8} fill="white" stroke="none" />
        {/* right eye */}
        <ellipse cx={SX + 17} cy={SY - 11} rx={5.5} ry={3.5} />
        <circle  cx={SX + 17} cy={SY - 11} r={1.8} fill="white" stroke="none" />
        {/* eyebrows */}
        <path d={`M ${SX-24},${SY-19} Q ${SX-17},${SY-25} ${SX-9},${SY-19}`} />
        <path d={`M ${SX+9},${SY-19}  Q ${SX+17},${SY-25} ${SX+24},${SY-19}`} />
        {/* nose */}
        <path
          strokeLinejoin="round"
          d={`M ${SX-4},${SY-1} L ${SX-3},${SY+4} L ${SX},${SY+8} L ${SX+3},${SY+4} L ${SX+4},${SY-1}`}
        />
        {/* mouth */}
        <path d={`M ${SX-14},${SY+18} Q ${SX},${SY+28} ${SX+14},${SY+18}`} />
        {/* cheek accent lines */}
        <path d={`M ${SX-30},${SY+4} L ${SX-21},${SY+2}`} />
        <path d={`M ${SX+21},${SY+2} L ${SX+30},${SY+4}`} />

        {/* ── 8-POINTED STARS ─────────────────────────────────── */}
        <S8 cx={55}  cy={92}  R={9}   r={3.5} />
        <S8 cx={335} cy={92}  R={9}   r={3.5} />
        <S8 cx={45}  cy={198} R={7}   r={2.7} />
        <S8 cx={345} cy={198} R={7}   r={2.7} />
        <S8 cx={60}  cy={320} R={8.5} r={3.3} />
        <S8 cx={330} cy={320} R={8.5} r={3.3} />
        <S8 cx={48}  cy={440} R={6}   r={2.3} />
        <S8 cx={342} cy={440} R={6}   r={2.3} />
        <S8 cx={72}  cy={642} R={9}   r={3.5} />
        <S8 cx={318} cy={642} R={9}   r={3.5} />
        <S8 cx={55}  cy={752} R={7}   r={2.7} />
        <S8 cx={335} cy={752} R={7}   r={2.7} />
        {/* top/bottom scattered */}
        <S8 cx={150} cy={74}  R={6}   r={2.3} />
        <S8 cx={240} cy={74}  R={6}   r={2.3} />
        <S8 cx={108} cy={793} R={6}   r={2.3} />
        <S8 cx={282} cy={793} R={6}   r={2.3} />

        {/* ── CRESCENT MOONS ──────────────────────────────────── */}
        {/* left column — opening toward centre (right) → deg≈0 */}
        <Moon cx={90}  cy={152} R={9} deg={15}  />
        <Moon cx={48}  cy={378} R={8} deg={5}   />
        <Moon cx={112} cy={600} R={8} deg={35}  />
        <Moon cx={78}  cy={728} R={7} deg={10}  />
        {/* right column — opening toward centre (left) → deg≈180 */}
        <Moon cx={300} cy={152} R={9} deg={165} />
        <Moon cx={342} cy={378} R={8} deg={175} />
        <Moon cx={278} cy={600} R={8} deg={145} />
        <Moon cx={312} cy={728} R={7} deg={170} />
        {/* bottom pair */}
        <Moon cx={165} cy={793} R={7} deg={270} />
        <Moon cx={225} cy={793} R={7} deg={270} />

        {/* ── TRIANGLES ───────────────────────────────────────── */}
        {/* △ upward */}
        <path d="M 80,262  L 90,278  L 70,278  Z" />
        <path d="M 310,262 L 320,278 L 300,278 Z" />
        <path d="M 65,478  L 74,492  L 56,492  Z" />
        <path d="M 325,478 L 334,492 L 316,492 Z" />
        {/* ▽ downward */}
        <path d="M 80,556  L 90,540  L 70,540  Z" />
        <path d="M 310,556 L 320,540 L 300,540 Z" />
        <path d="M 65,688  L 74,672  L 56,672  Z" />
        <path d="M 325,688 L 334,672 L 316,672 Z" />

        {/* ── SMALL DECORATIVE SQUARES (rotated 45°) ──────────── */}
        <rect x="-5" y="-5" width="10" height="10"
          transform="translate(80,395) rotate(45)" />
        <rect x="-5" y="-5" width="10" height="10"
          transform="translate(310,395) rotate(45)" />
        <rect x="-4" y="-4" width="8" height="8"
          transform="translate(80,520) rotate(45)" />
        <rect x="-4" y="-4" width="8" height="8"
          transform="translate(310,520) rotate(45)" />

      </g>
    </svg>
  )
}
