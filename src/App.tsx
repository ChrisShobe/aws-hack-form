import { useState } from 'react'
import JoinScreen from './screens/JoinScreen'
import HostDashboard from './screens/HostDashboard'
import PlayerGame from './screens/PlayerGame'

const params = new URLSearchParams(window.location.search)
const urlCode = params.get('code') ?? ''
const isHost = params.has('host')

type Screen = 'join' | 'host' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>(isHost ? 'host' : 'join')
  const [playerName, setPlayerName] = useState('')
  const [sessionCode, setSessionCode] = useState(urlCode)

  if (screen === 'host') return <HostDashboard />

  if (screen === 'game') {
    return (
      <PlayerGame
        playerName={playerName}
        sessionCode={sessionCode}
        onComplete={() => {}}
      />
    )
  }

  return (
    <JoinScreen
      defaultCode={sessionCode}
      onJoin={(name, code) => {
        setPlayerName(name)
        setSessionCode(code)
        setScreen('game')
      }}
      onCreateHost={() => setScreen('host')}
    />
  )
}
