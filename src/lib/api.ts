import { supabase } from './supabase'

export interface LBEntry { rank: number; name: string; score: number }

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createSession(customCode?: string): Promise<string> {
  const code = customCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || genCode()
  const { error } = await supabase.from('sessions').insert({ code })
  if (error?.code === '23505') throw new Error('Code already in use. Try another.')
  if (error) throw new Error(error.message)
  return code
}

export async function joinSession(code: string, name: string): Promise<void> {
  const { data: session } = await supabase
    .from('sessions').select('code').eq('code', code).maybeSingle()
  if (!session) throw new Error('Session not found — check the code!')

  const { error } = await supabase.from('players').insert({ session_code: code, name, score: 0 })
  if (error?.code === '23505') throw new Error('That name is already taken in this session!')
  if (error) throw new Error(error.message)
}

export async function submitResponse(
  code: string,
  player: string,
  questionId: string,
  questionText: string,
  answerLabel: string,
  points: number,
  cumulativeScore: number,
): Promise<void> {
  await Promise.all([
    supabase.from('players')
      .update({ score: cumulativeScore })
      .eq('session_code', code)
      .eq('name', player),
    supabase.from('responses').insert({
      session_code: code,
      player,
      question_id: questionId,
      question_text: questionText,
      answer: answerLabel,
      points_earned: points,
      cumulative_score: cumulativeScore,
    }),
  ])
}

export async function getLeaderboard(code: string): Promise<LBEntry[]> {
  const { data } = await supabase
    .from('players')
    .select('name, score')
    .eq('session_code', code)
    .order('score', { ascending: false })
  return (data ?? []).map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }))
}

export async function downloadCSV(code: string): Promise<void> {
  const { data } = await supabase
    .from('responses')
    .select('*')
    .eq('session_code', code)
    .order('created_at')

  if (!data?.length) { alert('No responses yet.'); return }

  const cols = ['session_code', 'player', 'question_id', 'question_text', 'answer', 'cumulative_score', 'points_earned', 'created_at']
  const csv = [
    cols.join(','),
    ...data.map(r => cols.map(c => `"${String((r as Record<string, unknown>)[c] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `feedback-${code}.csv`
  a.click()
}
