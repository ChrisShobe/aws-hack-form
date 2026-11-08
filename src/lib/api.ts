import { db } from './firebase'
import {
  doc, collection, setDoc, getDoc, addDoc, updateDoc, getDocs,
  query, orderBy, onSnapshot,
} from 'firebase/firestore'

export interface LBEntry { rank: number; name: string; score: number }

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createSession(customCode?: string): Promise<string> {
  const code = customCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || genCode()
  const ref = doc(db, 'sessions', code)
  if ((await getDoc(ref)).exists()) throw new Error('Code already in use. Try another.')
  await setDoc(ref, { createdAt: new Date().toISOString() })
  return code
}

export async function joinSession(code: string, name: string): Promise<void> {
  if (!(await getDoc(doc(db, 'sessions', code))).exists())
    throw new Error('Session not found — check the code!')
  const playerRef = doc(db, 'sessions', code, 'players', name)
  if ((await getDoc(playerRef)).exists()) throw new Error('That name is already taken in this session!')
  await setDoc(playerRef, { name, score: 0, createdAt: new Date().toISOString() })
}

export async function submitResponse(
  code: string, player: string,
  questionId: string, questionText: string,
  answerLabel: string, points: number, cumulativeScore: number,
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, 'sessions', code, 'players', player), { score: cumulativeScore }),
    addDoc(collection(db, 'sessions', code, 'responses'), {
      player, questionId, questionText,
      answer: answerLabel, pointsEarned: points, cumulativeScore,
      createdAt: new Date().toISOString(),
    }),
  ])
}

export function subscribeLeaderboard(code: string, cb: (entries: LBEntry[]) => void): () => void {
  const q = query(collection(db, 'sessions', code, 'players'), orderBy('score', 'desc'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map((d, i) => ({ rank: i + 1, name: d.data().name as string, score: d.data().score as number })))
  )
}

export async function downloadCSV(code: string): Promise<void> {
  const snap = await getDocs(query(collection(db, 'sessions', code, 'responses'), orderBy('createdAt')))
  if (snap.empty) { alert('No responses yet.'); return }
  const cols = ['player', 'questionId', 'questionText', 'answer', 'pointsEarned', 'cumulativeScore', 'createdAt']
  const csv = [
    cols.join(','),
    ...snap.docs.map(d => cols.map(c => `"${String((d.data() as Record<string,unknown>)[c] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `feedback-${code}.csv`
  a.click()
}
