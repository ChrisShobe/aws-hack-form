import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null

function resolveUrl(): string {
  // 1. URL param — players get ?backend=... embedded in their join link
  const param = new URLSearchParams(window.location.search).get('backend')
  if (param) { sessionStorage.setItem('aws_hack_backend', param); return param }
  // 2. Saved from a previous host setup in this tab
  const stored = sessionStorage.getItem('aws_hack_backend')
  if (stored) return stored
  // 3. Local dev
  if (import.meta.env.DEV) return 'http://localhost:3001'
  return ''
}

/** Called by HostDashboard when the host enters their server URL */
export function initSocket(url: string): Socket {
  sessionStorage.setItem('aws_hack_backend', url)
  _socket?.disconnect()
  _socket = io(url, {
    autoConnect: false,
    extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
  })
  return _socket
}

/** Used by everything else — reads URL param or sessionStorage */
export function getSocket(): Socket {
  if (!_socket) {
    const url = resolveUrl()
    _socket = io(url, {
      autoConnect: false,
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    })
  }
  return _socket
}
