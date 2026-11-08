import { useState } from 'react'
import { getSocket } from '../socket'

interface Props {
  defaultCode: string
  onJoin: (name: string, code: string) => void
  onCreateHost: () => void
}

export default function JoinScreen({ defaultCode, onJoin, onCreateHost }: Props) {
  const [mode, setMode] = useState<'pick' | 'join'>(defaultCode ? 'join' : 'pick')
  const [code, setCode] = useState(defaultCode)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleJoin() {
    if (!code.trim() || !name.trim()) return
    setLoading(true)
    setError('')
    const socket = getSocket()
    socket.connect()
    socket.emit('join-session', { code: code.trim().toUpperCase(), name: name.trim() }, (res: { ok?: boolean; error?: string }) => {
      setLoading(false)
      if (res?.error) { setError(res.error); socket.disconnect() }
      else onJoin(name.trim(), code.trim().toUpperCase())
    })
  }

  if (mode === 'pick') {
    return (
      <div className="splash">
        <div className="splash-logo">🚀</div>
        <div className="splash-badge">AWS × A10 HACK 2026</div>
        <h1>Participant Feedback</h1>
        <h2>Gamified Survey — Earn points, hit the leaderboard!</h2>
        <p>All survey responses are anonymous. Have fun with the trivia!</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => setMode('join')}>🎮 Join a Session</button>
          <button className="btn btn-secondary" onClick={onCreateHost}>🎛️ I'm an Organizer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="splash">
      <div className="splash-logo">🎮</div>
      <div className="splash-badge">AWS × A10 HACK 2026</div>
      <h1>Join the Survey</h1>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '0.75rem 1.25rem', color: '#fca5a5', fontWeight: 700, maxWidth: 380, textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="name-input-group">
        <label>Room Code</label>
        <input
          type="text"
          placeholder="e.g. AWSHACK"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          maxLength={10}
          style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '1.4rem', textAlign: 'center' }}
        />
      </div>

      <div className="name-input-group">
        <label>Your display name (shown on leaderboard)</label>
        <input
          type="text"
          placeholder="e.g. HackerPro42"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && code.trim() && name.trim() && handleJoin()}
          maxLength={24}
          autoFocus={!!defaultCode}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary" disabled={!code.trim() || !name.trim() || loading} onClick={handleJoin}>
          {loading ? 'Joining...' : '🚀 Join Session'}
        </button>
        {!defaultCode && <button className="btn btn-secondary" onClick={() => setMode('pick')}>← Back</button>}
      </div>

      <p style={{ fontSize: '0.78rem', color: 'rgba(148,163,184,0.6)' }}>
        Get the room code from the event screen or organizer
      </p>
    </div>
  )
}
