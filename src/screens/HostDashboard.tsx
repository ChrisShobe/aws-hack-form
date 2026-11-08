import { useState, useEffect } from 'react'
import { socket } from '../socket'

interface Player { rank: number; name: string; score: number }

export default function HostDashboard() {
  const [step, setStep] = useState<'create' | 'live'>('create')
  const [customCode, setCustomCode] = useState('')
  const [code, setCode] = useState('')
  const [joinUrls, setJoinUrls] = useState<string[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  useEffect(() => {
    socket.connect()
    socket.on('leaderboard-update', setPlayers)
    socket.on('participants-update', setPlayers)
    return () => {
      socket.off('leaderboard-update', setPlayers)
      socket.off('participants-update', setPlayers)
    }
  }, [])

  function createSession() {
    setError('')
    socket.emit('create-session', { customCode: customCode.trim() || undefined }, (res: { code?: string; joinUrls?: string[]; joinUrl?: string; error?: string }) => {
      if (res?.error) { setError(res.error); return }
      setCode(res.code!)
      setJoinUrls(res.joinUrls ?? (res.joinUrl ? [res.joinUrl] : []))
      setStep('live')
    })
  }

  function copyUrl(url: string, idx: number) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  const rankEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

  if (step === 'create') {
    return (
      <div className="splash">
        <div className="splash-logo">🎛️</div>
        <div className="splash-badge">ORGANIZER MODE</div>
        <h1>Create a Session</h1>
        <p>Participants will join using your room code. Leave blank for a random code.</p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 10,
            padding: '0.75rem 1.25rem',
            color: '#fca5a5',
            fontWeight: 700,
            maxWidth: 380,
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
            onKeyDown={e => e.key === 'Enter' && createSession()}
            autoFocus
          />
        </div>

        <button className="btn btn-primary" onClick={createSession}>
          Create Session →
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
        <a
          href={`/api/export/${code}`}
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
        >
          ⬇ Export CSV
        </a>
      </div>

      <div className="code-card">
        <div className="code-label">Room Code</div>
        <div className="code-big">{code}</div>

        {joinUrls.length <= 1 ? (
          <>
            <div className="join-url-text">{joinUrls[0]}</div>
            <button className="btn btn-secondary btn-sm" onClick={() => copyUrl(joinUrls[0], 0)}>
              {copiedIdx === 0 ? '✅ Copied!' : '📋 Copy Join URL'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.78rem', color: '#f5c518', fontWeight: 700, marginBottom: '0.25rem' }}>
              Multiple network interfaces detected — try each URL on a phone until one works:
            </div>
            {joinUrls.map((url, i) => (
              <div key={url} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="join-url-text" style={{ margin: 0 }}>{url}</div>
                <button className="btn btn-secondary btn-sm" onClick={() => copyUrl(url, i)}>
                  {copiedIdx === i ? '✅' : '📋'}
                </button>
              </div>
            ))}
          </>
        )}

        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
          Share a URL or just the code — participants enter it on the join screen
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
              <div
                key={p.name}
                className="leaderboard-entry"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
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
