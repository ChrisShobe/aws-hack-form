import { useState, useEffect } from 'react'
import { createSession, downloadCSV } from '../lib/api'
import { supabase } from '../lib/supabase'

interface Player { name: string; score: number }

export default function HostDashboard() {
  const [step, setStep] = useState<'create' | 'live'>('create')
  const [customCode, setCustomCode] = useState('')
  const [code, setCode] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // Subscribe to live player updates once session is created
  useEffect(() => {
    if (!code) return

    // Initial load
    supabase.from('players').select('name, score').eq('session_code', code)
      .order('score', { ascending: false })
      .then(({ data }) => setPlayers(data ?? []))

    const channel = supabase
      .channel(`host-${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `session_code=eq.${code}` },
        () => {
          supabase.from('players').select('name, score').eq('session_code', code)
            .order('score', { ascending: false })
            .then(({ data }) => setPlayers(data ?? []))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [code])

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const newCode = await createSession(customCode || undefined)
      setCode(newCode)
      setStep('live')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function copyUrl(url: string, idx: number) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  const joinUrl = `${window.location.origin}?code=${code}`
  const rankEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

  if (step === 'create') {
    return (
      <div className="splash">
        <div className="splash-logo">🎛️</div>
        <div className="splash-badge">ORGANIZER MODE</div>
        <h1>Create a Session</h1>
        <p>Participants join using your room code. Leave blank for a random code.</p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 10,
            padding: '0.75rem 1.25rem',
            color: '#fca5a5',
            fontWeight: 700,
            maxWidth: 380,
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="name-input-group">
          <label>Custom room code (optional)</label>
          <input
            type="text"
            placeholder="e.g. AWSHACK26"
            value={customCode}
            onChange={e => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={10}
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', fontSize: '1.3rem' }}
            onKeyDown={e => e.key === 'Enter' && !loading && handleCreate()}
            autoFocus
          />
        </div>

        <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create Session →'}
        </button>
        <a href="/" className="btn btn-secondary btn-sm">← Back</a>
      </div>
    )
  }

  return (
    <div className="host-dashboard">
      <div className="host-header">
        <div>
          <div style={{ font: '900 1rem Nunito', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Host Dashboard
          </div>
          <div style={{ font: '800 0.85rem Nunito', color: '#475569' }}>
            {players.length} participant{players.length !== 1 ? 's' : ''} joined
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => downloadCSV(code)}
        >
          ⬇ Export CSV
        </button>
      </div>

      <div className="code-card">
        <div className="code-label">Room Code</div>
        <div className="code-big">{code}</div>
        <div className="join-url-text">{joinUrl}</div>
        <button className="btn btn-secondary btn-sm" onClick={() => copyUrl(joinUrl, 0)}>
          {copiedIdx === 0 ? '✅ Copied!' : '📋 Copy Join URL'}
        </button>
        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
          Share this URL — it works from any device on any network
        </div>
      </div>

      <div className="host-leaderboard">
        <div className="host-lb-title">
          <span>Live Leaderboard</span>
          <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
            Updates as people answer
          </span>
        </div>

        {players.length === 0 ? (
          <div className="waiting-msg">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            Waiting for participants to join...
          </div>
        ) : (
          <div className="leaderboard-list">
            {players.map((p, i) => (
              <div key={p.name} className="leaderboard-entry" style={{ animationDelay: `${i * 0.04}s` }}>
                <span className="lb-rank">{rankEmoji(i)}</span>
                <span className="lb-name">{p.name}</span>
                <span className="lb-score">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
