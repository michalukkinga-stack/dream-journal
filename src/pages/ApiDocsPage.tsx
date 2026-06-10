import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check } from 'lucide-react'

const BASE = 'https://rrwynlvefmotlthypdcx.supabase.co/functions/v1'
const MCP_PATH = '/path/to/dream-journal/mcp-server/dist/index.js'

// ── Nav sections ────────────────────────────────────────────────
const NAV_API = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'wprowadzenie', label: 'Wprowadzenie' },
  { id: 'endpointy', label: 'Endpointy', children: [
    { id: 'add-dream', label: 'POST /add-dream' },
    { id: 'ask-jung', label: 'POST /ask-jung-api' },
    { id: 'get-dream', label: 'GET /get-dream' },
  ]},
  { id: 'autentykacja', label: 'Jak uzyskać token' },
  { id: 'uwagi', label: 'Uwagi techniczne' },
]

const NAV_MCP = [
  { id: 'mcp-intro', label: 'Wprowadzenie' },
  { id: 'mcp-instalacja', label: 'Instalacja' },
  { id: 'mcp-narzedzia', label: 'Narzędzia', children: [
    { id: 'mcp-add-dream', label: 'add_dream' },
    { id: 'mcp-ask-jung', label: 'ask_jung' },
    { id: 'mcp-get-dream', label: 'get_dream' },
  ]},
  { id: 'mcp-konfiguracja', label: 'Konfiguracja Claude' },
]

// ── Copy button ──────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 text-xs font-ui text-white/40 hover:text-white/80 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Skopiowano' : 'Kopiuj'}
    </button>
  )
}

// ── Tabbed Code Block ────────────────────────────────────────────
function CodeTabs({ tabs }: { tabs: { label: string; code: string }[] }) {
  const [active, setActive] = useState(0)
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mb-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="flex items-center border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex gap-0">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              className={`font-ui text-xs px-4 py-2.5 border-b-2 transition-colors ${
                i === active
                  ? 'border-purple-400 text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto pr-3">
          <CopyButton text={tabs[active].code} />
        </div>
      </div>
      <pre className="px-4 py-3 text-xs text-green-300 overflow-x-auto font-mono leading-relaxed">
        {tabs[active].code}
      </pre>
    </div>
  )
}

// ── Plain Code Block ─────────────────────────────────────────────
function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mb-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
      {label && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="font-ui text-xs text-white/40">{label}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="px-4 py-3 text-xs text-green-300 overflow-x-auto font-mono leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

// ── Field Table ──────────────────────────────────────────────────
function FieldTable({ rows }: { rows: { name: string; type: string; required: boolean; desc: string }[] }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mb-5">
      <table className="w-full text-sm font-ui">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
            <th className="text-left px-4 py-2.5 text-white/40 font-medium text-xs">Pole</th>
            <th className="text-left px-4 py-2.5 text-white/40 font-medium text-xs">Typ</th>
            <th className="text-left px-4 py-2.5 text-white/40 font-medium text-xs">Wymagane</th>
            <th className="text-left px-4 py-2.5 text-white/40 font-medium text-xs">Opis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td className="px-4 py-2.5"><code className="text-purple-300 text-xs bg-purple-500/10 px-1.5 py-0.5 rounded">{r.name}</code></td>
              <td className="px-4 py-2.5 text-white/50 text-xs font-mono">{r.type}</td>
              <td className="px-4 py-2.5 text-xs">{r.required ? <span className="text-rose-400">tak</span> : <span className="text-white/30">nie</span>}</td>
              <td className="px-4 py-2.5 text-white/60 text-xs">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Response Codes ───────────────────────────────────────────────
function ResponseCodes({ rows }: { rows: { status: string; color: string; desc: string }[] }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden mb-5">
      {rows.map((r, i) => (
        <div
          key={r.status}
          className="flex items-start gap-3 px-4 py-2.5"
          style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
        >
          <span className={`font-ui text-xs font-bold px-2 py-0.5 rounded shrink-0 text-white ${r.color}`}>{r.status}</span>
          <span className="font-ui text-white/60 text-xs pt-0.5">{r.desc}</span>
        </div>
      ))}
    </div>
  )
}

// ── Endpoint Block ───────────────────────────────────────────────
function EndpointBlock({
  id, method, path, description, children,
}: {
  id: string
  method: 'POST' | 'GET' | 'TOOL'
  path: string
  description: string
  children: React.ReactNode
}) {
  const color = method === 'POST' ? 'bg-emerald-600' : method === 'GET' ? 'bg-blue-600' : 'bg-violet-600'
  return (
    <div id={id} className="mb-10 scroll-mt-24">
      <div className="flex items-center gap-3 mb-3">
        <span className={`font-ui text-xs font-bold px-2.5 py-1 rounded-md text-white shrink-0 ${color}`}>{method}</span>
        <code className="font-mono text-sm text-purple-200 break-all">{path}</code>
      </div>
      <p className="font-ui text-white/60 text-sm mb-5 leading-relaxed">{description}</p>
      {children}
    </div>
  )
}

// ── Section heading ──────────────────────────────────────────────
function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display text-white text-lg font-bold mb-6 pb-3 border-b border-white/10 scroll-mt-24">
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="font-ui text-white/35 text-[10px] uppercase tracking-widest mb-2 mt-5">{children}</p>
}

// ── Callout ──────────────────────────────────────────────────────
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl px-4 py-3 mb-5 border border-purple-500/25" style={{ background: 'rgba(139,92,246,0.08)' }}>
      <span className="text-purple-400 mt-0.5 shrink-0 text-sm">ℹ</span>
      <p className="font-ui text-white/65 text-sm leading-relaxed">{children}</p>
    </div>
  )
}

// ── Mode toggle ──────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: 'api' | 'mcp'; onChange: (m: 'api' | 'mcp') => void }) {
  return (
    <div className="flex items-center rounded-lg border border-white/15 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
      {(['api', 'mcp'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`font-ui text-xs px-3 py-1.5 transition-colors ${
            mode === m
              ? 'bg-purple-600 text-white'
              : 'text-white/45 hover:text-white/80'
          }`}
        >
          {m === 'api' ? 'REST API' : 'MCP'}
        </button>
      ))}
    </div>
  )
}

// ── Sidebar nav ──────────────────────────────────────────────────
type NavItem = { id: string; label: string; children?: { id: string; label: string }[] }

function SidebarNav({ items, active, onNavigate }: {
  items: NavItem[]
  active: string
  onNavigate: (id: string) => void
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
              active === item.id
                ? 'text-white bg-white/10'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {item.label}
          </button>
          {item.children?.map((child) => (
            <button
              key={child.id}
              onClick={() => onNavigate(child.id)}
              className={`w-full text-left text-xs px-3 py-1.5 pl-6 rounded-lg transition-colors ${
                active === child.id
                  ? 'text-purple-300 bg-purple-500/10'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {child.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MCP CONTENT
// ═══════════════════════════════════════════════════════════════════
function McpContent() {
  return (
    <>
      {/* ── INTRO ── */}
      <section id="mcp-intro" className="mb-12 scroll-mt-24">
        <SectionHeading id="_mcp_intro">Wprowadzenie</SectionHeading>
        <p className="font-ui text-white/60 text-sm mb-4 leading-relaxed">
          Dream Journal udostępnia serwer MCP (Model Context Protocol), który pozwala agentom AI — takim jak Claude — bezpośrednio zarządzać dziennikiem snów bez potrzeby obsługi HTTP.
        </p>
        <Callout>
          MCP używa transportu stdio — serwer uruchamiany jest lokalnie na Twoim komputerze i komunikuje się z Claude Desktop przez standardowe wejście/wyjście.
        </Callout>
        <SubHeading>Wymagania</SubHeading>
        <ul className="space-y-1.5 mb-4">
          {['Node.js 18+', 'Claude Desktop (wersja z obsługą MCP)', 'Token Supabase (JWT) — patrz sekcja API › Jak uzyskać token'].map((item) => (
            <li key={item} className="font-ui text-white/60 text-sm flex gap-2">
              <span className="text-purple-400 shrink-0">›</span>{item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── INSTALACJA ── */}
      <section id="mcp-instalacja" className="mb-12 scroll-mt-24">
        <SectionHeading id="_mcp_install">Instalacja</SectionHeading>
        <SubHeading>1. Sklonuj i zbuduj serwer</SubHeading>
        <CodeBlock code={`cd dream-journal/mcp-server\nnpm install\nnpm run build`} label="Terminal" />
        <SubHeading>2. Ustaw token</SubHeading>
        <p className="font-ui text-white/60 text-sm mb-3 leading-relaxed">
          Token przekazujesz przez zmienną środowiskową <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">DREAM_JOURNAL_TOKEN</code> — możesz go ustawić w konfiguracji Claude Desktop (patrz niżej) lub eksportować w shellu.
        </p>
        <CodeBlock code={`export DREAM_JOURNAL_TOKEN="<twoj_supabase_jwt>"\nnode ${MCP_PATH}`} label="Terminal" />
      </section>

      {/* ── NARZĘDZIA ── */}
      <section id="mcp-narzedzia" className="mb-12 scroll-mt-24">
        <SectionHeading id="_mcp_tools">Narzędzia</SectionHeading>

        {/* add_dream */}
        <EndpointBlock
          id="mcp-add-dream"
          method="TOOL"
          path="add_dream"
          description="Dodaje nowy wpis do dziennika. Jeśli nie podasz tagów — AI (Haiku) wywnioskuje je z opisu. Odpowiada endpointowi POST /add-dream."
        >
          <SubHeading>Parametry</SubHeading>
          <FieldTable rows={[
            { name: 'description', type: 'string', required: true, desc: 'Opis snu, może zawierać HTML' },
            { name: 'tags', type: 'string[]', required: false, desc: 'Lista motywów; jeśli pominięta, AI dobierze automatycznie' },
            { name: 'date', type: 'YYYY-MM-DD', required: false, desc: 'Data wpisu; domyślnie: dzisiaj' },
          ]} />
          <SubHeading>Przykład wywołania przez Claude</SubHeading>
          <CodeBlock code={`// Claude automatycznie wywoła to narzędzie gdy powiesz:
// "Zapisz mój dzisiejszy sen: śniło mi się, że latałam nad miastem"

{
  "description": "Śniło mi się, że latałam nad miastem.",
  "date": "2026-06-05"
}`} label="JSON" />
          <SubHeading>Odpowiedź</SubHeading>
          <CodeBlock code={`{
  "id":          "550e8400-e29b-41d4-a716-446655440000",
  "description": "Śniło mi się, że latałam nad miastem.",
  "tags":        ["Latanie", "Miasto", "Euforia"],
  "date":        "2026-06-05T12:00:00"
}`} label="JSON" />
        </EndpointBlock>

        {/* ask_jung */}
        <EndpointBlock
          id="mcp-ask-jung"
          method="TOOL"
          path="ask_jung"
          description="Pyta agenta AI wcielającego się w rolę Carla Gustava Junga o interpretację snu. Odpowiada endpointowi POST /ask-jung-api."
        >
          <SubHeading>Parametry</SubHeading>
          <FieldTable rows={[
            { name: 'question', type: 'string', required: true, desc: 'Pytanie do Junga' },
            { name: 'date', type: 'YYYY-MM-DD', required: false, desc: 'Dzień snu; domyślnie: dzisiaj' },
          ]} />
          <SubHeading>Przykład wywołania przez Claude</SubHeading>
          <CodeBlock code={`// "Co może znaczyć mój sen z dzisiaj o lataniu?"

{
  "question": "Co może oznaczać mój sen o lataniu?",
  "date": "2026-06-05"
}`} label="JSON" />
          <SubHeading>Odpowiedź</SubHeading>
          <CodeBlock code={`"Latanie często symbolizuje pragnienie wolności i uwolnienia się od codziennych ograniczeń..."`} label="string" />
        </EndpointBlock>

        {/* get_dream */}
        <EndpointBlock
          id="mcp-get-dream"
          method="TOOL"
          path="get_dream"
          description="Pobiera wpis snu i historię czatu z Jungiem dla podanego dnia. Pole dream jest null gdy brak wpisu. Odpowiada endpointowi GET /get-dream."
        >
          <SubHeading>Parametry</SubHeading>
          <FieldTable rows={[
            { name: 'date', type: 'YYYY-MM-DD', required: false, desc: 'Dzień do pobrania; domyślnie: dzisiaj' },
          ]} />
          <SubHeading>Przykład wywołania przez Claude</SubHeading>
          <CodeBlock code={`// "Pokaż mi mój sen z 5 czerwca"

{ "date": "2026-06-05" }`} label="JSON" />
          <SubHeading>Odpowiedź</SubHeading>
          <CodeBlock code={`{
  "date": "2026-06-05",
  "dream": {
    "id":                "550e8400-...",
    "description":       "<p>Śniło mi się...</p>",
    "description_plain": "Śniło mi się...",
    "tags":              ["Latanie", "Miasto"],
    "created_at":        "2026-06-05T12:00:00"
  },
  "chat": [
    { "role": "user",      "content": "Co to znaczy?",         "created_at": "..." },
    { "role": "assistant", "content": "Latanie symbolizuje...", "created_at": "..." }
  ]
}`} label="JSON" />
        </EndpointBlock>
      </section>

      {/* ── KONFIGURACJA ── */}
      <section id="mcp-konfiguracja" className="mb-12 scroll-mt-24">
        <SectionHeading id="_mcp_config">Konfiguracja Claude Desktop</SectionHeading>
        <p className="font-ui text-white/60 text-sm mb-4 leading-relaxed">
          Otwórz plik konfiguracyjny Claude Desktop i dodaj wpis dla serwera Dream Journal:
        </p>
        <SubHeading>Lokalizacja pliku</SubHeading>
        <CodeTabs tabs={[
          { label: 'macOS', code: '~/Library/Application Support/Claude/claude_desktop_config.json' },
          { label: 'Windows', code: '%APPDATA%\\Claude\\claude_desktop_config.json' },
        ]} />
        <SubHeading>Konfiguracja</SubHeading>
        <CodeBlock code={`{
  "mcpServers": {
    "dream-journal": {
      "command": "node",
      "args": ["${MCP_PATH}"],
      "env": {
        "DREAM_JOURNAL_TOKEN": "<twoj_supabase_jwt>"
      }
    }
  }
}`} label="claude_desktop_config.json" />
        <Callout>
          Po zapisaniu pliku uruchom ponownie Claude Desktop. Narzędzia pojawią się automatycznie w panelu narzędzi. Możesz przetestować wpisując: <em>"Zapisz mój dzisiejszy sen..."</em>
        </Callout>
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// API CONTENT
// ═══════════════════════════════════════════════════════════════════
function ApiContent() {
  return (
    <>
      {/* ── QUICK START ── */}
      <section id="quick-start" className="mb-12 scroll-mt-24">
        <SectionHeading id="_quick_start">Quick Start</SectionHeading>
        <p className="font-ui text-white/60 text-sm mb-5 leading-relaxed">
          Poniżej kompletny przykład — od logowania do pierwszej odpowiedzi Junga — w trzech krokach.
        </p>

        <SubHeading>1. Uzyskaj token</SubHeading>
        <CodeTabs tabs={[
          {
            label: 'curl',
            code: `curl -X POST \\
  "https://rrwynlvefmotlthypdcx.supabase.co/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: <anon_key>" \\
  -d '{"email": "user@example.com", "password": "haslo"}'

# Zapisz access_token z odpowiedzi:
# { "access_token": "eyJ...", "token_type": "bearer", ... }`,
          },
          {
            label: 'JavaScript',
            code: `const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'haslo',
})
const TOKEN = data.session.access_token`,
          },
        ]} />

        <SubHeading>2. Dodaj sen</SubHeading>
        <CodeTabs tabs={[
          {
            label: 'curl',
            code: `curl -X POST ${BASE}/add-dream \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Śniło mi się, że latałam nad miastem.",
    "date": "2026-06-05"
  }'

# Odpowiedź 201:
# { "id": "550e...", "tags": ["Latanie", "Miasto", "Euforia"], ... }`,
          },
          {
            label: 'JavaScript',
            code: `const res = await fetch('${BASE}/add-dream', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${TOKEN}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    description: 'Śniło mi się, że latałam nad miastem.',
    date: '2026-06-05',
  }),
})
const dream = await res.json()  // { id, tags, date, ... }`,
          },
        ]} />

        <SubHeading>3. Zapytaj Junga i pobierz wynik</SubHeading>
        <CodeTabs tabs={[
          {
            label: 'curl',
            code: `# Zapytaj Junga
curl -X POST ${BASE}/ask-jung-api \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Co może oznaczać mój sen?", "date": "2026-06-05"}'

# Pobierz sen + historię czatu
curl "${BASE}/get-dream?date=2026-06-05" \\
  -H "Authorization: Bearer <token>"`,
          },
          {
            label: 'JavaScript',
            code: `// Zapytaj Junga
const { answer } = await fetch('${BASE}/ask-jung-api', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${TOKEN}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ question: 'Co może oznaczać mój sen?', date: '2026-06-05' }),
}).then(r => r.json())

// Pobierz sen + historię czatu
const { dream, chat } = await fetch(
  \`${BASE}/get-dream?date=2026-06-05\`,
  { headers: { 'Authorization': \`Bearer \${TOKEN}\` } }
).then(r => r.json())`,
          },
        ]} />
      </section>

      {/* ── WPROWADZENIE ── */}
      <section id="wprowadzenie" className="mb-12 scroll-mt-24">
        <SectionHeading id="_intro">Wprowadzenie</SectionHeading>
        <SubHeading>Baza URL</SubHeading>
        <CodeBlock code={BASE} />
        <SubHeading>Autentykacja</SubHeading>
        <p className="font-ui text-white/60 text-sm mb-3 leading-relaxed">
          Każdy endpoint wymaga nagłówka <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> z tokenem JWT użytkownika Supabase.
        </p>
        <CodeBlock code="Authorization: Bearer <supabase_user_jwt>" />
        <Callout>
          Token wygasa — jeśli dostaniesz 401, odśwież sesję lub zaloguj się ponownie.
        </Callout>
      </section>

      {/* ── ENDPOINTY ── */}
      <section id="endpointy" className="mb-12 scroll-mt-24">
        <SectionHeading id="_endpoints">Endpointy</SectionHeading>

        <EndpointBlock
          id="add-dream"
          method="POST"
          path="/add-dream"
          description="Dodaje nowy wpis do dziennika snów. Jeśli nie podasz daty — wpis trafia do dzisiejszego dnia. Jeśli nie podasz tagów — AI (Haiku) wywnioskuje je z opisu."
        >
          <SubHeading>Request Body</SubHeading>
          <FieldTable rows={[
            { name: 'description', type: 'string', required: true, desc: 'Opis snu, może zawierać HTML' },
            { name: 'tags', type: 'string[]', required: false, desc: 'Lista motywów; jeśli pusta, AI dobierze automatycznie' },
            { name: 'date', type: 'YYYY-MM-DD', required: false, desc: 'Data wpisu; domyślnie: dzisiaj' },
          ]} />

          <SubHeading>Odpowiedzi</SubHeading>
          <ResponseCodes rows={[
            { status: '201', color: 'bg-emerald-700', desc: 'Wpis dodany — zwraca id, description, tags, date' },
            { status: '400', color: 'bg-rose-700', desc: 'Brak pola description' },
            { status: '401', color: 'bg-orange-700', desc: 'Brak lub nieprawidłowy token' },
            { status: '500', color: 'bg-zinc-600', desc: 'Błąd bazy danych lub AI' },
          ]} />

          <SubHeading>Przykłady</SubHeading>
          <CodeTabs tabs={[
            {
              label: 'curl',
              code: `curl -X POST ${BASE}/add-dream \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Śniło mi się, że latałam nad miastem.", "date": "2026-06-05"}'`,
            },
            {
              label: 'JavaScript',
              code: `const res = await fetch('${BASE}/add-dream', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    description: 'Śniło mi się, że latałam nad miastem.',
    date: '2026-06-05',
  }),
})
const data = await res.json()`,
            },
            {
              label: 'Python',
              code: `import requests

r = requests.post(
    '${BASE}/add-dream',
    headers={'Authorization': 'Bearer <token>'},
    json={
        'description': 'Śniło mi się, że latałam nad miastem.',
        'date': '2026-06-05',
    }
)
print(r.json())`,
            },
          ]} />

          <SubHeading>Odpowiedź 201</SubHeading>
          <CodeBlock code={`{
  "id":          "550e8400-e29b-41d4-a716-446655440000",
  "description": "Śniło mi się, że latałam...",
  "tags":        ["Latanie", "Miasto", "Euforia"],
  "date":        "2026-06-05T12:00:00"
}`} label="JSON" />
        </EndpointBlock>

        <EndpointBlock
          id="ask-jung"
          method="POST"
          path="/ask-jung-api"
          description="Wysyła pytanie do agenta AI wcielającego się w rolę Carla Gustava Junga. Agent ma dostęp do snu z podanego dnia oraz historii ostatnich 50 wpisów. Zwraca krótką odpowiedź po polsku."
        >
          <SubHeading>Request Body</SubHeading>
          <FieldTable rows={[
            { name: 'question', type: 'string', required: true, desc: 'Pytanie do Junga' },
            { name: 'date', type: 'YYYY-MM-DD', required: false, desc: 'Dzień snu, do którego nawiązuje pytanie; domyślnie: dzisiaj' },
          ]} />

          <SubHeading>Odpowiedzi</SubHeading>
          <ResponseCodes rows={[
            { status: '200', color: 'bg-emerald-700', desc: 'Odpowiedź Junga — zwraca answer, date' },
            { status: '400', color: 'bg-rose-700', desc: 'Brak pola question' },
            { status: '401', color: 'bg-orange-700', desc: 'Brak lub nieprawidłowy token' },
          ]} />

          <SubHeading>Przykłady</SubHeading>
          <CodeTabs tabs={[
            {
              label: 'curl',
              code: `curl -X POST ${BASE}/ask-jung-api \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Co może oznaczać mój sen o lataniu?", "date": "2026-06-05"}'`,
            },
            {
              label: 'JavaScript',
              code: `const res = await fetch('${BASE}/ask-jung-api', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: 'Co może oznaczać mój sen o lataniu?',
    date: '2026-06-05',
  }),
})
const { answer } = await res.json()`,
            },
          ]} />

          <SubHeading>Odpowiedź 200</SubHeading>
          <CodeBlock code={`{
  "answer": "Latanie często symbolizuje pragnienie wolności...",
  "date":   "2026-06-05"
}`} label="JSON" />
        </EndpointBlock>

        <EndpointBlock
          id="get-dream"
          method="GET"
          path="/get-dream?date=YYYY-MM-DD"
          description="Pobiera wpis snu i pełną historię czatu z Jungiem dla podanego dnia. Jeśli nie podasz daty — zwraca dane dla dzisiaj. Pole dream jest null gdy brak wpisu."
        >
          <SubHeading>Query Parameters</SubHeading>
          <FieldTable rows={[
            { name: 'date', type: 'YYYY-MM-DD', required: false, desc: 'Dzień do pobrania; domyślnie: dzisiaj' },
          ]} />

          <SubHeading>Odpowiedzi</SubHeading>
          <ResponseCodes rows={[
            { status: '200', color: 'bg-emerald-700', desc: 'Dane dnia — dream (lub null) + chat[]' },
            { status: '400', color: 'bg-rose-700', desc: 'Nieprawidłowy format daty' },
            { status: '401', color: 'bg-orange-700', desc: 'Brak lub nieprawidłowy token' },
          ]} />

          <SubHeading>Przykłady</SubHeading>
          <CodeTabs tabs={[
            {
              label: 'curl',
              code: `curl "${BASE}/get-dream?date=2026-06-05" \\
  -H "Authorization: Bearer <token>"`,
            },
            {
              label: 'JavaScript',
              code: `const res = await fetch(
  '${BASE}/get-dream?date=2026-06-05',
  { headers: { 'Authorization': 'Bearer <token>' } }
)
const { dream, chat } = await res.json()`,
            },
          ]} />

          <SubHeading>Odpowiedź 200</SubHeading>
          <CodeBlock code={`{
  "date": "2026-06-05",
  "dream": {
    "id":                "550e8400-...",
    "description":       "<p>Śniło mi się...</p>",
    "description_plain": "Śniło mi się...",
    "tags":              ["Latanie", "Miasto"],
    "created_at":        "2026-06-05T12:00:00"
  },
  "chat": [
    { "role": "user",      "content": "Co to znaczy?",         "created_at": "..." },
    { "role": "assistant", "content": "Latanie symbolizuje...", "created_at": "..." }
  ]
}`} label="JSON" />
        </EndpointBlock>
      </section>

      {/* ── AUTENTYKACJA ── */}
      <section id="autentykacja" className="mb-12 scroll-mt-24">
        <SectionHeading id="_auth">Jak uzyskać token</SectionHeading>
        <p className="font-ui text-white/60 text-sm mb-4 leading-relaxed">
          Zaloguj się do aplikacji, otwórz konsolę przeglądarki (F12) i wpisz:
        </p>
        <CodeBlock code="(await supabase.auth.getSession()).data.session.access_token" />
        <p className="font-ui text-white/60 text-sm mb-4 mt-2 leading-relaxed">
          Lub przez Supabase Auth REST API:
        </p>
        <CodeTabs tabs={[
          {
            label: 'curl',
            code: `curl -X POST \\
  "https://rrwynlvefmotlthypdcx.supabase.co/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: <anon_key>" \\
  -d '{"email": "...", "password": "..."}'`,
          },
          {
            label: 'JavaScript',
            code: `const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'haslo',
})
const token = data.session.access_token`,
          },
        ]} />
      </section>

      {/* ── UWAGI ── */}
      <section id="uwagi" className="mb-12 scroll-mt-24">
        <SectionHeading id="_notes">Uwagi techniczne</SectionHeading>
        <ul className="space-y-3">
          {[
            { icon: '🕐', text: 'Daty przechowywane i zwracane w UTC' },
            { icon: '📝', text: 'Pole description może zawierać HTML z edytora TipTap; description_plain to czysty tekst' },
            { icon: '🤖', text: 'Wnioskowanie tagów: claude-haiku-4-5 (szybki); odpowiedzi Junga: claude-sonnet-4-6' },
            { icon: '💬', text: 'Kontekst Junga: ostatnie 50 wpisów; limit czatu w get-dream: 100 wiadomości' },
            { icon: '🌐', text: 'CORS: Access-Control-Allow-Origin: * (akceptuje żądania z każdej domeny)' },
          ].map(({ icon, text }) => (
            <li key={text} className="flex gap-3 p-3 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-sm shrink-0">{icon}</span>
              <span className="font-ui text-white/60 text-sm leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════
export function ApiDocsPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'api' | 'mcp'>('api')
  const [activeSection, setActiveSection] = useState('wprowadzenie')
  const mainRef = useRef<HTMLDivElement>(null)

  const nav = mode === 'api' ? NAV_API : NAV_MCP

  // Reset active section when switching modes
  const handleModeChange = (m: 'api' | 'mcp') => {
    setMode(m)
    setActiveSection(m === 'api' ? 'wprowadzenie' : 'mcp-intro')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Highlight active section on scroll
  useEffect(() => {
    const apiIds = ['quick-start', 'wprowadzenie', 'add-dream', 'ask-jung', 'get-dream', 'autentykacja', 'uwagi']
    const mcpIds = ['mcp-intro', 'mcp-instalacja', 'mcp-add-dream', 'mcp-ask-jung', 'mcp-get-dream', 'mcp-konfiguracja']
    const ids = mode === 'api' ? apiIds : mcpIds

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id) })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [mode])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen font-ui" style={{ background: '#1f2937' }}>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 border-b border-white/10 backdrop-blur-md" style={{ background: 'rgba(31,41,55,0.85)' }}>
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/15 text-white/50 hover:text-white hover:border-white/40 transition-all"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="h-4 w-px bg-white/15" />
          <span className="font-display text-white text-sm font-semibold">Dokumentacja</span>
          <span className="font-ui text-white/30 text-xs">Dream Journal · v1</span>
          <div className="ml-auto">
            <ModeToggle mode={mode} onChange={handleModeChange} />
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 flex gap-10 pt-8 pb-20">

        {/* ── Left sidebar ── */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24">
            <SidebarNav items={nav} active={activeSection} onNavigate={scrollTo} />
          </div>
        </aside>

        {/* ── Main content ── */}
        <main ref={mainRef} className="flex-1 min-w-0">

          {/* Page title */}
          <div className="mb-8">
            <p className="font-ui text-purple-400 text-xs uppercase tracking-widest mb-2">Dokumentacja</p>
            <h1 className="font-display text-white text-3xl font-bold mb-3">
              {mode === 'api' ? 'API Reference' : 'MCP Reference'}
            </h1>
            <p className="font-ui text-white/55 text-base leading-relaxed">
              {mode === 'api'
                ? 'Dream Journal API — Supabase Edge Functions (Deno). Programistyczne zarządzanie wpisami, pytania do agenta Junga i pobieranie danych.'
                : 'Dream Journal MCP Server — lokalny serwer stdio dla Claude Desktop. Pozwala agentom AI bezpośrednio zarządzać dziennikiem snów.'}
            </p>
          </div>

          {mode === 'api' ? <ApiContent /> : <McpContent />}

        </main>
      </div>
    </div>
  )
}
