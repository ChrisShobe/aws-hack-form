import { useState, useCallback, useEffect } from 'react'
import { questions } from '../questions'
import type { Question } from '../questions'
import { submitResponse, getLeaderboard } from '../lib/api'
import { supabase } from '../lib/supabase'
import {
  SurveyMCQuestion,
  TriviaMCQuestion,
  RatingQuestion,
  FreeResponseQuestion,
} from '../components/QuestionTypes'

interface LBEntry { rank: number; name: string; score: number }

interface Props {
  playerName: string
  sessionCode: string
  onComplete: (score: number) => void
}

function Confetti() {
  const colors = ['#f5c518', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6', '#f97316']
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 2,
  }))
  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  )
}

function FinalScreen({ playerName, finalScore, sessionCode }: { playerName: string; finalScore: number; sessionCode: string }) {
  const [board, setBoard] = useState<LBEntry[]>([])
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    getLeaderboard(sessionCode).then(setBoard)

    const channel = supabase
      .channel(`player-done-${sessionCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `session_code=eq.${sessionCode}` },
        () => getLeaderboard(sessionCode).then(setBoard)
      )
      .subscribe()

    const t = setTimeout(() => setShowConfetti(false), 4500)
    return () => { supabase.removeChannel(channel); clearTimeout(t) }
  }, [sessionCode])

  const myRank = board.findIndex(e => e.name === playerName)
  const rankEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

  return (
    <div className="leaderboard-screen">
      {showConfetti && <Confetti />}
      <div style={{ fontSize: '3rem' }}>🏆</div>
      <div className="leaderboard-title">Survey Complete!</div>

      <div className="my-score-card">
        <div style={{ font: '700 1rem Nunito', color: '#94a3b8' }}>Your Score</div>
        <div className="big-score">{finalScore.toLocaleString()}</div>
        <div style={{ font: '700 0.9rem Nunito', color: '#94a3b8' }}>
          {myRank === 0 ? "🎉 You're #1!" : myRank >= 0 ? `You ranked #${myRank + 1}` : ''}
        </div>
      </div>

      <div className="leaderboard-list">
        {board.map((e, i) => (
          <div
            key={i}
            className={`leaderboard-entry ${e.name === playerName ? 'me' : ''}`}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <span className="lb-rank">{rankEmoji(i)}</span>
            <span className="lb-name">{e.name}</span>
            {e.name === playerName && <span className="lb-you-badge">YOU</span>}
            <span className="lb-score">{e.score.toLocaleString()}</span>
          </div>
        ))}
        {board.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        )}
      </div>

      <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', maxWidth: 400 }}>
        Thanks for completing the survey! Your feedback helps make AWS × A10 Hack even better. 🚀
      </div>
    </div>
  )
}

export default function PlayerGame({ playerName, sessionCode, onComplete }: Props) {
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const question = questions[qIdx]
  const total = questions.length

  const handleAnswer = useCallback((answerLabel: string, points: number) => {
    const q = questions[qIdx]
    const next = Math.max(0, score + points)
    setScore(next)

    // Fire-and-forget save to Supabase
    submitResponse(sessionCode, playerName, q.id, q.text, answerLabel, points, next)

    if (qIdx + 1 >= total) {
      setFinalScore(next)
      setDone(true)
      onComplete(next)
    } else {
      setQIdx(i => i + 1)
    }
  }, [qIdx, score, total, sessionCode, playerName, onComplete])

  if (done) {
    return <FinalScreen playerName={playerName} finalScore={finalScore} sessionCode={sessionCode} />
  }

  return (
    <div className="game-shell">
      <div className="game-header">
        <div>
          <div style={{ font: '800 0.9rem Nunito', color: '#94a3b8' }}>{playerName}</div>
          <div className="question-counter">Question {qIdx + 1} / {total}</div>
        </div>
        <div style={{ flex: 1, padding: '0 1rem' }}>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${(qIdx / total) * 100}%` }} />
          </div>
        </div>
        <div className="score-pill">⭐ {Math.max(0, score).toLocaleString()}</div>
      </div>

      <div className="game-body">
        <QuestionView key={question.id} question={question} onAnswer={handleAnswer} />
      </div>
    </div>
  )
}

function QuestionView({ question, onAnswer }: { question: Question; onAnswer: (label: string, pts: number) => void }) {
  switch (question.type) {
    case 'survey-mc':
    case 'yes-no':
      return <SurveyMCQuestion question={question} onAnswer={onAnswer} />
    case 'trivia-mc':
      return <TriviaMCQuestion question={question} onAnswer={onAnswer} />
    case 'survey-rating':
      return <RatingQuestion question={question} onAnswer={onAnswer} />
    case 'free-response':
      return <FreeResponseQuestion question={question} onAnswer={onAnswer} />
    default:
      return null
  }
}
