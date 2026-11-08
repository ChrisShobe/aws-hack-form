import { useState, useEffect } from 'react'
import { initSocket } from '../socket'

interface Player { rank: number; name: string; score: number }

export default function HostDashboard() {
  const [step, setStep] = useState<'setup' | 'live'>('setup')
  const [serverUrl, setServerUrl] = useState(import.meta.env.DEV ? 'http://localhost:3001' : '')
  const [customCode, setCustomCode] = useState('')
  const [code, setCode] = useState('')
  const [joinUrl, setJoinUrl] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // socket is set up only after the host enters their server URL
  const [sock, setSock] = useState<ReturnType<typeof initSocket> | null>(null)

  useEffect(() => {
    if (!sock) return
    sock.on('leaderboard-update', setPlayers)
    sock.on('participants-update', setPlayers)
    return () => { sock.off('leaderboard-update', setPlayers); sock.off('participants-update', setPlayers) }
  }, [sock])

  function handleCreate() {
    const trimmed = serverUrl.trim().replace(/\/$/, '')
    if (!trimmed) { setError('Enter your server URL first.'); return }

    setLoading(true)
    setError('')

    const s = initSocket(trimmed)
    s.connect()
    s.emit('create-session', { customCode: customCode.trim() || undefined }, (res: { code?: string; error?: string }) => {
      setLoading(false)
      if (res?.error) { setError(res.error); s.disconnect(); return }

      const newCode = res.code!
      // Embed backend URL in the join link so players know where to connect
      const base = window.location.origin
      const url = `${base}?code=${newCode}&backend=${encodeURIComponent(trimmed)}`
      setCode(newCode)
      setJoinUrl(url)
      setSock(s)
      setStep('live')
    })
  }

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text).then(() => { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000) })
  }

  const rankEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

  if (step === 'setup') {
    return (
      <div className="splash">
        <div className="splash-logo">🎛️</div>
        <div className="splash-badge">ORGANIZER MODE</div>
        <h1>Create a Session</h1>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '0.75rem 1.25rem', color: '#fca5a5', fontWeight: 700, maxWidth: 420, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="name-input-group" style={{ maxWidth: 420 }}>
          <label>Your server URL</label>
          <input
            type="url"
            placeholder="https://xxxx-xx-xx.ngrok-free.app"
            value={serverUrl}
            onChange={e => { setServerUrl(e.target.value); setError('') }}
            autoFocus={!import.meta.env.DEV}
          />
          <span style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.25rem' }}>
            Run <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>npx ngrok http 3001</code> on your laptop and paste the URL here
          </span>
        </div>

        <div className="name-input-group" style={{ maxWidth: 420 }}>
          <label>Custom room code (optional)</label>
          <input
            type="text"
            placeholder="e.g. AWSHACK26"
            value={customCode}
            onChange={e => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={10}
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', fontSize: '1.3rem' }}
            onKeyDown={e => e.key === 'Enter' && !loading && handleCreate()}
          />
        </div>

        <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !serverUrl.trim()}>
          {loading ? 'Connecting...' : 'Create Session →'}
        </button>
      </div>
    )
  }

  return (
    <div className="host-dashboard">
      <div className="host-header">
        <div>
          <div style={{ font: '900 1rem Nunito', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Host Dashboard</div>
          <div style={{ font: '800 0.85rem Nunito', color: '#475569' }}>{players.length} participant{players.length !== 1 ? 's' : ''} joined</div>
        </div>
        <a href={`${serverUrl}/api/export/${code}`} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} target="_blank" rel="noreferrer">
          ⬇ Export CSV
        </a>
      </div>

      <div className="code-card">
        <div className="code-label">Room Code</div>
        <div className="code-big">{code}</div>
        <div className="join-url-text">{joinUrl}</div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => copy(joinUrl, 0)}>
            {copiedIdx === 0 ? '✅ Copied!' : '📋 Copy Join URL'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => copy(code, 1)}>
            {copiedIdx === 1 ? '✅ Copied!' : '🔑 Copy Code Only'}
          </button>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
          Share the full URL — it works from any device on any network
        </div>
      </div>

      <div className="host-leaderboard">
        <div className="host-lb-title">
          <span>Live Leaderboard</span>
          <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Updates as people answer</span>
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
