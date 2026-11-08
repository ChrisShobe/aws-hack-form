import { useState, useEffect, useRef } from 'react'
import type { Question } from '../questions'

const CHOICE_ICONS = ['▲', '◆', '●', '■']
const CHOICE_LABELS = ['A', 'B', 'C', 'D']

// ── Timer ring ────────────────────────────────────────────────────
export function TimerRing({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const r = 45
  const circ = 2 * Math.PI * r
  const pct = timeLeft / totalTime
  const offset = circ * (1 - pct)
  const color = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f5c518' : '#ef4444'

  return (
    <div className="timer-ring-wrap">
      <svg width="110" height="110" className="timer-ring">
        <circle className="timer-ring-bg" cx="55" cy="55" r={r} />
        <circle
          className="timer-ring-fill"
          cx="55" cy="55" r={r}
          style={{ strokeDasharray: circ, strokeDashoffset: offset, stroke: color }}
        />
        <text
          x="55" y="55"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: color,
            fontFamily: 'Nunito',
            fontWeight: 900,
            fontSize: '1.5rem',
            transform: 'rotate(90deg)',
            transformOrigin: '55px 55px',
          }}
        >
          {timeLeft}
        </text>
      </svg>
      <div className="timer-sub">secs left</div>
    </div>
  )
}

// ── Survey / Yes-No MC ────────────────────────────────────────────
export function SurveyMCQuestion({
  question,
  onAnswer,
}: {
  question: Question
  onAnswer: (label: string, points: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const pts = question.points ?? 100

  function pick(i: number) {
    if (selected !== null) return
    setSelected(i)
    setTimeout(() => onAnswer(question.choices![i].label, pts), 900)
  }

  return (
    <>
      <div className="question-card">
        <span className="question-type-badge badge-survey">
          {question.type === 'yes-no' ? '🗳️ Vote' : '📋 Survey'}
        </span>
        <div className="question-text">{question.text}</div>
        {question.subtext && <div className="question-subtext">{question.subtext}</div>}
        <div className="points-label">⭐ +{pts} pts for answering</div>
      </div>

      <div className="choices-grid">
        {question.choices!.map((c, i) => (
          <button
            key={i}
            className={`choice-btn ${selected === i ? 'selected-correct' : selected !== null ? 'dimmed' : ''}`}
            onClick={() => pick(i)}
            disabled={selected !== null}
          >
            <span className="choice-icon">{CHOICE_ICONS[i] ?? '•'}</span>
            <span className="choice-label">{c.label}</span>
          </button>
        ))}
      </div>

      {selected !== null && (
        <div className="feedback-overlay">
          <div className="feedback-card survey">
            <div className="feedback-emoji">🎉</div>
            <h2>Response Logged!</h2>
            <div className="feedback-points">+{pts} points</div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Trivia MC ─────────────────────────────────────────────────────
export function TriviaMCQuestion({
  question,
  onAnswer,
}: {
  question: Question
  onAnswer: (label: string, points: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const pts = question.points ?? 200
  const correctIdx = question.choices!.findIndex(c => c.correct)

  function pick(i: number) {
    if (selected !== null) return
    setSelected(i)
    const earned = i === correctIdx ? pts : -Math.round(pts / 2)
    setTimeout(() => onAnswer(question.choices![i].label, earned), 1400)
  }

  const isCorrect = selected !== null && selected === correctIdx

  return (
    <>
      <div className="question-card">
        <span className="question-type-badge badge-trivia">⚡ Trivia</span>
        <div className="question-text">{question.text}</div>
        <div className="points-label">⭐ Correct: +{pts} · Wrong: -{Math.round(pts / 2)}</div>
      </div>

      <div className="choices-grid">
        {question.choices!.map((c, i) => {
          let cls = ''
          if (selected !== null) {
            if (i === correctIdx) cls = 'correct'
            else if (i === selected) cls = 'selected-wrong'
            else cls = 'dimmed'
          }
          return (
            <button
              key={i}
              className={`choice-btn ${cls}`}
              onClick={() => pick(i)}
              disabled={selected !== null}
            >
              <span className="choice-icon">{CHOICE_LABELS[i]}</span>
              <span className="choice-label">{c.label}</span>
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="feedback-overlay">
          <div className={`feedback-card ${isCorrect ? 'correct' : 'wrong'}`}>
            <div className="feedback-emoji">{isCorrect ? '🎯' : '💥'}</div>
            <h2>{isCorrect ? 'Correct!' : 'Oops!'}</h2>
            <div className="feedback-points">
              {isCorrect ? `+${pts} points!` : `-${Math.round(pts / 2)} points`}
            </div>
            {!isCorrect && (
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Correct: {question.choices![correctIdx].label}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── Rating ────────────────────────────────────────────────────────
export function RatingQuestion({
  question,
  onAnswer,
}: {
  question: Question
  onAnswer: (label: string, points: number) => void
}) {
  const labels = question.ratingLabels!
  const [ratings, setRatings] = useState<number[]>(labels.map(() => 0))
  const ptsEach = question.points ?? 50
  const allRated = ratings.every(r => r > 0)

  function setRating(i: number, v: number) {
    setRatings(prev => { const n = [...prev]; n[i] = v; return n })
  }

  function submit() {
    const summary = labels.map((l, i) => `${l}:${ratings[i]}/5`).join('; ')
    onAnswer(summary, ptsEach * ratings.filter(r => r > 0).length)
  }

  return (
    <>
      <div className="question-card">
        <span className="question-type-badge badge-rating">⭐ Ratings</span>
        <div className="question-text">{question.text}</div>
        <div className="question-subtext">Rate each category — all ratings earn {ptsEach} pts each!</div>
        <div className="points-label">⭐ Up to +{ptsEach * labels.length} pts total</div>
      </div>

      <div className="rating-grid" style={{ width: '100%', maxWidth: 640, padding: '0 0.5rem' }}>
        {labels.map((lbl, i) => (
          <div className="rating-row" key={lbl}>
            <span className="rating-label">{lbl}</span>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  className={`star-btn ${ratings[i] >= v ? 'active' : ''}`}
                  onClick={() => setRating(i, v)}
                  aria-label={`${v} star`}
                >★</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-green" disabled={!allRated} onClick={submit}>
        Submit Ratings →
      </button>
    </>
  )
}

// ── Free Response ─────────────────────────────────────────────────
export function FreeResponseQuestion({
  question,
  onAnswer,
}: {
  question: Question
  onAnswer: (text: string, points: number) => void
}) {
  const totalTime = question.timeLimit ?? 60
  const basePts = question.points ?? 200
  const [timeLeft, setTimeLeft] = useState(totalTime)
  const [text, setText] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          if (!submittedRef.current) {
            submittedRef.current = true
            onAnswer(text || '(no response)', 0)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [])

  function submit() {
    if (submittedRef.current) return
    submittedRef.current = true
    clearInterval(intervalRef.current!)
    const earned = Math.round(basePts * (timeLeft / totalTime))
    onAnswer(text || '(no response)', earned)
  }

  const earnable = Math.round(basePts * (timeLeft / totalTime))

  return (
    <>
      <div className="question-card">
        <span className="question-type-badge badge-freetext">✏️ Free Response</span>
        <div className="question-text">{question.text}</div>
        {question.subtext && <div className="question-subtext">{question.subtext}</div>}
        <div className="points-label">⭐ Submit now for ~{earnable} pts (fewer as time runs out)</div>
      </div>

      <div className="free-response-row">
        <TimerRing timeLeft={timeLeft} totalTime={totalTime} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <textarea
            className="free-response-textarea"
            placeholder="Type your response here..."
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <button className="btn btn-green" onClick={submit} disabled={timeLeft === 0}>
            Submit & Earn {earnable} pts →
          </button>
        </div>
      </div>
    </>
  )
}
