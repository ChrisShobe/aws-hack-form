import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dirname, '../responses.json')

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) }
  catch { return { sessions: {}, responses: [] } }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

export function createSession(code) {
  const data = load()
  if (!data.sessions[code]) {
    data.sessions[code] = { createdAt: new Date().toISOString() }
  }
  save(data)
}

export function saveResponse(code, player, questionId, questionText, answer, cumulativeScore, pointsEarned) {
  const data = load()
  data.responses.push({
    session_code: code,
    player,
    question_id: questionId,
    question_text: questionText,
    answer,
    cumulative_score: cumulativeScore,
    points_earned: pointsEarned,
    timestamp: new Date().toISOString(),
  })
  save(data)
}

export function getResponses(code) {
  return load().responses.filter(r => r.session_code === code)
}
