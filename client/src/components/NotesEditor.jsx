import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import RoomManager from './RoomManager'
import VersionHistory from './VersionHistory'
import UserCursors from './UserCursors'
import ActiveUsers from './ActiveUsers'
import './NotesEditor.css'

const NotesEditor = () => {
  const [content, setContent] = useState('')
  const [roomId, setRoomId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [usersCount, setUsersCount] = useState(0)
  const [activeUsers, setActiveUsers] = useState([])
  const [roomInfo, setRoomInfo] = useState(null)
  const [showRoomManager, setShowRoomManager] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [cursors, setCursors] = useState([])
  const [userName, setUserName] = useState(`User_${Date.now()}`)
  const [isPasswordRequired, setIsPasswordRequired] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const socketRef = useRef(null)
  const textareaRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const cursorUpdateTimeoutRef = useRef(null)
  
  // Initialize socket connection
  useEffect(() => {
    const initSocket = () => {
      const serverUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3003'
      
      socketRef.current = io(serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })
      
      const socket = socketRef.current
      
      socket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
        setError('')
      })
      
      socket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
        setError('Disconnected from server')
      })
      
      socket.on('load-content', (data) => {
        setContent(data.content)
        setRoomInfo(data.roomInfo)
        setLoading(false)
      })
      
      socket.on('update-content', (data) => {
        setContent(data.content)
        // Show update indicator
        if (data.updatedBy) {
          setError(`Updated by ${data.updatedBy}`)
          setTimeout(() => setError(''), 2000)
        }
      })
      
      socket.on('users-count', (count) => {
        setUsersCount(count)
      })
      
      socket.on('active-users', (users) => {
        setActiveUsers(users)
      })
      
      socket.on('cursor-update', (data) => {
        setCursors(prev => {
          const filtered = prev.filter(cursor => cursor.userId !== data.userId)
          return [...filtered, data]
        })
      })
      
      socket.on('user-typing', (data) => {
        setTypingUsers(prev => {
          const filtered = prev.filter(user => user.userId !== data.userId)
          return data.isTyping ? [...filtered, data] : filtered
        })
      })
      
      socket.on('room-password-required', (data) => {
        setIsPasswordRequired(true)
        setLoading(false)
      })
      
      socket.on('error', (data) => {
        setError(data.message)
        setLoading(false)
      })
      
      socket.on('ping', () => {
        socket.emit('pong')
      })
    }
    
    initSocket()
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])
  
  // Join room
  const joinRoom = async (roomIdInput, passwordInput = '', userNameInput = '') => {
    if (!roomIdInput || !roomIdInput.trim()) {
      setError('Please enter a room ID')
      return
    }
    
    setLoading(true)
    setError('')
    
    const socket = socketRef.current
    if (!socket) {
      setError('Not connected to server')
      setLoading(false)
      return
    }
    
    socket.emit('join-room', {
      roomId: roomIdInput.trim(),
      password: passwordInput,
      userName: userNameInput || userName
    })
    
    setRoomId(roomIdInput.trim())
    setPassword('')
    setIsPasswordRequired(false)
    
    if (userNameInput) {
      setUserName(userNameInput)
    }
  }
  
  // Handle text change
  const handleTextChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true)
      socketRef.current?.emit('typing', { roomId, isTyping: true })
    }
    
    // Clear typing timeout
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socketRef.current?.emit('typing', { roomId, isTyping: false })
    }, 1000)
    
    // Emit content update
    socketRef.current?.emit('update-content', {
      roomId,
      content: newContent,
      shouldEncrypt: false
    })
    
    // Update cursor position
    updateCursorPosition()
  }
  
  // Update cursor position
  const updateCursorPosition = () => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    
    // Debounce cursor updates
    clearTimeout(cursorUpdateTimeoutRef.current)
    cursorUpdateTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('cursor-update', {
        roomId,
        cursorPosition,
        selectionStart,
        selectionEnd
      })
    }, 100)
  }
  
  // Handle cursor and selection changes
  const handleCursorChange = () => {
    updateCursorPosition()
  }
  
  // Get version history
  const getVersionHistory = () => {
    socketRef.current?.emit('get-version-history', { roomId, limit: 20 })
  }
  
  // Restore version
  const restoreVersion = (versionId) => {
    socketRef.current?.emit('restore-version', { roomId, versionId })
  }
  
  // Show room manager
  const handleShowRoomManager = () => {
    console.log('Opening room manager')
    setShowRoomManager(true)
  }
  
  // Show version history
  const handleShowVersionHistory = () => {
    setShowVersionHistory(true)
    getVersionHistory()
  }
  
  // Connection indicator
  const ConnectionIndicator = () => (
    <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-dot"></div>
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  )
  
  return (
    <div className="notes-editor">
      <div className="header">
        <div className="header-left">
          <h1>HadesNotes</h1>
          <ConnectionIndicator />
        </div>
        
        <div className="header-center">
          {roomInfo && (
            <div className="room-info">
              <span className="room-name">{roomInfo.name}</span>
              {roomInfo.hasPassword && <span className="password-indicator">🔒</span>}
              {roomInfo.autoDeleteHours && (
                <span className="auto-delete-info">
                  Auto-delete: {roomInfo.autoDeleteHours}h
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="header-right">
          <button 
            className="btn btn-secondary"
            onClick={handleShowRoomManager}
            disabled={!isConnected}
          >
            Room Manager
          </button>
          
          {roomId && (
            <button 
              className="btn btn-secondary"
              onClick={handleShowVersionHistory}
              disabled={!isConnected}
            >
              Version History
            </button>
          )}
          
          <ActiveUsers users={activeUsers} />
          
          <div className="users-count">
            <span className="users-icon">👥</span>
            <span>{usersCount}</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className={`error-message ${error.includes('Updated by') ? 'info' : 'error'}`}>
          {error}
        </div>
      )}
      
      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}
      
      {!roomId && !isPasswordRequired && (
        <div className="welcome-screen">
          <div className="welcome-container">
            <div className="welcome-header">
              <h2>Welcome to HadesNotes</h2>
              <p>Create a new room or join an existing one to start collaborating</p>
            </div>
            
            <div className="welcome-tabs">
              <button 
                className={`tab-button ${showRoomManager ? 'active' : ''}`}
                onClick={() => setShowRoomManager(true)}
              >
                Create Room
              </button>
              <button 
                className={`tab-button ${!showRoomManager ? 'active' : ''}`}
                onClick={() => setShowRoomManager(false)}
              >
                Join Room
              </button>
            </div>
            
            {!showRoomManager && (
              <div className="join-form">
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={50}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Room ID</label>
                  <input
                    type="text"
                    placeholder="Enter room ID"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        joinRoom(e.target.value, '', userName)
                      }
                    }}
                    maxLength={100}
                    className="form-input"
                  />
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter room ID"]')
                    joinRoom(input.value, '', userName)
                  }}
                  disabled={!isConnected || loading}
                >
                  Join Room
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {isPasswordRequired && (
        <div className="password-required">
          <div className="password-form">
            <h2>Password Required</h2>
            <p>This room is password protected</p>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    joinRoom(roomId, password, userName)
                  }
                }}
                maxLength={100}
              />
            </div>
            <div className="form-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => joinRoom(roomId, password, userName)}
                disabled={!isConnected || loading}
              >
                Join Room
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsPasswordRequired(false)
                  setRoomId('')
                  setPassword('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {roomId && !isPasswordRequired && (
        <div className="editor-container">
          <div className="editor-wrapper">
            <UserCursors 
              cursors={cursors}
              textareaRef={textareaRef}
              content={content}
            />
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onSelect={handleCursorChange}
              onKeyUp={handleCursorChange}
              onClick={handleCursorChange}
              placeholder="Start typing your notes..."
              className="editor-textarea"
              disabled={!isConnected || loading}
            />
            
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.map(user => (
                  <span key={user.userId} style={{ color: user.color }}>
                    {user.userName} is typing...
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {showRoomManager && (
        <RoomManager
          socket={socketRef.current}
          onClose={() => setShowRoomManager(false)}
          onJoinRoom={(roomId, password, userName) => {
            setShowRoomManager(false)
            joinRoom(roomId, password, userName)
          }}
          currentRoomId={roomId}
        />
      )}
      
      {showVersionHistory && (
        <VersionHistory
          socket={socketRef.current}
          roomId={roomId}
          onClose={() => setShowVersionHistory(false)}
          onRestore={restoreVersion}
        />
      )}
    </div>
  )
}

export default NotesEditor
