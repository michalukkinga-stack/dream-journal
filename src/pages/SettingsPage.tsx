import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, RefreshCw, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

type ApiToken = {
  id: string
  token: string
  name: string
  created_at: string
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchTokens()
  }, [user])

  async function fetchTokens() {
    setLoading(true)
    const { data, error } = await supabase
      .from('api_tokens')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setTokens(data ?? [])
    setLoading(false)
  }

  async function generateToken() {
    if (!user) return
    setGenerating(true)
    setError(null)
    const { error } = await supabase
      .from('api_tokens')
      .insert({ user_id: user.id, name: 'Mój token' })
    if (error) setError(error.message)
    else await fetchTokens()
    setGenerating(false)
  }

  async function deleteToken(id: string) {
    const { error } = await supabase.from('api_tokens').delete().eq('id', id)
    if (error) setError(error.message)
    else setTokens(t => t.filter(tok => tok.id !== id))
  }

  function copyToken(token: ApiToken) {
    navigator.clipboard.writeText(token.token)
    setCopiedId(token.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const mcpConfig = tokens[0]
    ? JSON.stringify({
        mcpServers: {
          'dream-journal': {
            url: 'https://dream-journal-five.vercel.app/api/mcp',
            headers: { Authorization: `Bearer ${tokens[0].token}` },
          },
        },
      }, null, 2)
    : null

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Ustawienia</h1>
        </div>

        {/* Token section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Tokeny API</h2>
              <p className="text-sm text-white/50 mt-0.5">
                Używaj tokenów, żeby połączyć zewnętrzne programy (np. Claude Desktop) z twoim dziennikiem.
              </p>
            </div>
            <button
              onClick={generateToken}
              disabled={generating}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
            >
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              Nowy token
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white/40 text-sm">Ładowanie...</div>
          ) : tokens.length === 0 ? (
            <div className="p-6 border border-white/10 rounded-2xl text-center text-white/40 text-sm">
              Nie masz jeszcze żadnych tokenów. Wygeneruj pierwszy, żeby połączyć Claude Desktop.
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map(tok => (
                <div
                  key={tok.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{tok.name}</span>
                    <span className="text-xs text-white/30">
                      {new Date(tok.created_at).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-black/30 px-3 py-2 rounded-lg font-mono text-indigo-300 truncate">
                      {tok.token}
                    </code>
                    <button
                      onClick={() => copyToken(tok)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Kopiuj token"
                    >
                      {copiedId === tok.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/50" />}
                    </button>
                    <button
                      onClick={() => deleteToken(tok.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Usuń token"
                    >
                      <Trash2 size={14} className="text-white/30 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Claude Desktop config */}
        {mcpConfig && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Konfiguracja Claude Desktop</h2>
            <p className="text-sm text-white/50 mb-4">
              Wklej poniższy fragment do pliku <code className="text-indigo-300">claude_desktop_config.json</code>:
            </p>
            <div className="relative">
              <pre className="bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/70 overflow-x-auto">
                {mcpConfig}
              </pre>
              <button
                onClick={() => { navigator.clipboard.writeText(mcpConfig); setCopiedId('config') ; setTimeout(() => setCopiedId(null), 2000) }}
                className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white/40 hover:text-white/80 transition-colors"
              >
                {copiedId === 'config' ? <Check size={12} /> : <Copy size={12} />}
                {copiedId === 'config' ? 'Skopiowano' : 'Kopiuj'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
