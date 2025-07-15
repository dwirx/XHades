import { useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'

const App = () => {
  const [socket, setSocket] = useState(null)
  const [content, setContent] = useState('')
  const [roomId, setRoomId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [usersCount, setUsersCount] = useState(0)
  const [lastSaved, setLastSaved] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Generate room ID dari URL atau buat baru
  useEffect(() => {
    const path = window.location.pathname
    const roomMatch = path.match(/^\/room\/([a-zA-Z0-9]+)$/)
    
    if (roomMatch) {
      setRoomId(roomMatch[1])
    } else {
      // Generate room ID baru
      const newRoomId = Math.random().toString(36).substring(2, 15)
      setRoomId(newRoomId)
      window.history.pushState({}, '', `/room/${newRoomId}`)
    }
  }, [])

  // Setup socket connection
  useEffect(() => {
    if (!roomId) return

    const newSocket = io()
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
      newSocket.emit('join-room', roomId)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('load-content', (data) => {
      setContent(data.content || '')
      setIsLoading(false)
    })

    newSocket.on('update-content', (data) => {
      setContent(data.content)
      setLastSaved(new Date())
    })

    newSocket.on('users-count', (count) => {
      setUsersCount(count)
    })

    return () => {
      newSocket.close()
    }
  }, [roomId])

  // Debounce untuk auto-save
  useEffect(() => {
    if (!socket || !isConnected || isLoading) return

    const timeoutId = setTimeout(() => {
      socket.emit('update-content', {
        roomId,
        content
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [content, socket, isConnected, roomId, isLoading])

  const handleContentChange = useCallback((e) => {
    setContent(e.target.value)
  }, [])

  const handleShare = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('Link telah disalin ke clipboard!')
    })
  }, [])

  const formatLastSaved = useCallback(() => {
    if (!lastSaved) return ''
    return `Terakhir disimpan: ${lastSaved.toLocaleTimeString()}`
  }, [lastSaved])

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Real-time Notes</h1>
        <div className="room-info">
          <div className="room-id">
            Room: {roomId}
          </div>
          <button className="share-btn" onClick={handleShare}>
            Share
          </button>
        </div>
      </header>
      
      <main className="main-content">
        <div className="note-container">
          <textarea
            className="note-textarea"
            placeholder="Mulai menulis notes Anda di sini..."
            value={content}
            onChange={handleContentChange}
          />
          <div className="status-bar">
            <div className="connection-status">
              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="users-count">
              {usersCount} user{usersCount !== 1 ? 's' : ''} online
            </div>
            <div className="last-saved">
              {formatLastSaved()}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
