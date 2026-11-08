import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { networkInterfaces } from 'os'
import * as db from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

/** @type {Map<string, { players: Map<string, {name:string,score:number}>, hostSocketId:string }>} */
const rooms = new Map()

function genCode(custom) {
  if (custom?.trim()) {
    return custom.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function getAllLocalIPs() {
  const all = []
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const addr of (ifaces ?? [])) {
      if (addr.family === 'IPv4' && !addr.internal) all.push(addr.address)
    }
  }
  // Prefer 192.168.x.x (WiFi/LAN), then 10.x.x.x, then anything else
  const wifi = all.filter(ip => ip.startsWith('192.168.'))
  const corp = all.filter(ip => ip.startsWith('10.'))
  const rest = all.filter(ip => !ip.startsWith('192.168.') && !ip.startsWith('10.'))
  return [...wifi, ...corp, ...rest]
}

function getLocalIP() {
  const ips = getAllLocalIPs()
  return ips[0] ?? 'localhost'
}

function leaderboard(room) {
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }))
}

io.on('connection', (socket) => {
  socket.on('create-session', ({ customCode } = {}, cb) => {
    const code = genCode(customCode)
    if (rooms.has(code)) return cb?.({ error: 'Code already in use. Try another.' })
    rooms.set(code, { players: new Map(), hostSocketId: socket.id })
    db.createSession(code)
    socket.join(`room:${code}`)
    socket.data = { role: 'host', code }
    const ips = getAllLocalIPs()
    const joinUrls = ips.length
      ? ips.map(ip => `http://${ip}:3001?code=${code}`)
      : [`http://localhost:3001?code=${code}`]
    cb?.({ code, joinUrl: joinUrls[0], joinUrls })
  })

  socket.on('join-session', ({ code, name }, cb) => {
    const upper = (code ?? '').toUpperCase()
    const room = rooms.get(upper)
    if (!room) return cb?.({ error: 'Session not found — check the code!' })
    room.players.set(socket.id, { name, score: 0 })
    socket.join(`room:${upper}`)
    socket.data = { role: 'player', code: upper, name }
    io.to(`room:${upper}`).emit('participants-update', leaderboard(room))
    cb?.({ ok: true })
  })

  socket.on('submit-response', ({ questionId, questionText, answerLabel, points }) => {
    const { code, name } = socket.data ?? {}
    if (!code || !name) return
    const room = rooms.get(code)
    if (!room) return
    const player = room.players.get(socket.id)
    if (!player) return
    player.score = Math.max(0, player.score + (points ?? 0))
    db.saveResponse(code, name, questionId, questionText, answerLabel, player.score, points ?? 0)
    io.to(`room:${code}`).emit('leaderboard-update', leaderboard(room))
  })

  socket.on('survey-complete', () => {
    const { code } = socket.data ?? {}
    if (!code) return
    const room = rooms.get(code)
    if (room) io.to(`room:${code}`).emit('leaderboard-update', leaderboard(room))
  })

  socket.on('get-leaderboard', ({ code }, cb) => {
    const room = rooms.get((code ?? '').toUpperCase())
    cb?.(room ? leaderboard(room) : [])
  })

  socket.on('disconnect', () => {
    const { code, role } = socket.data ?? {}
    if (!code) return
    const room = rooms.get(code)
    if (!room) return
    if (role === 'player') {
      room.players.delete(socket.id)
      io.to(`room:${code}`).emit('participants-update', leaderboard(room))
    }
  })
})

// CSV export
app.get('/api/export/:code', (req, res) => {
  const rows = db.getResponses(req.params.code.toUpperCase())
  if (!rows.length) return res.status(404).send('No responses yet for this session.')
  const cols = ['session_code', 'player', 'question_id', 'question_text', 'answer', 'cumulative_score', 'points_earned', 'timestamp']
  const csv = [
    cols.join(','),
    ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="feedback-${req.params.code}.csv"`)
  res.send(csv)
})

// Serve built React app in production
app.use(express.static(join(__dirname, '../dist')))
app.use((_, res) => res.sendFile(join(__dirname, '../dist/index.html')))

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  const ips = getAllLocalIPs()
  console.log(`\n🚀  Server ready`)
  console.log(`    Local:   http://localhost:${PORT}`)
  ips.forEach(ip => console.log(`    Network: http://${ip}:${PORT}`))
  console.log(`    Host:    http://localhost:${PORT}?host=1`)
  if (ips.length > 1) {
    console.log(`\n    ⚠️  Multiple network IPs detected. If participants can't connect,`)
    console.log(`       try each Network URL above until one works from a phone.\n`)
  } else {
    console.log()
  }
})
