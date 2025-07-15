import React, { useState, useEffect } from 'react'
import './RoomManager.css'

const RoomManager = ({ socket, onClose, onJoinRoom, currentRoomId }) => {
  const [activeTab, setActiveTab] = useState('create')
  const [joinData, setJoinData] = useState({
    roomId: '',
    password: '',
    userName: localStorage.getItem('userName') || ''
  })
  const [createData, setCreateData] = useState({
    roomName: '',
    password: '',
    autoDeleteHours: 24,
    hasPassword: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recentRooms, setRecentRooms] = useState([])
  const [createdRoomId, setCreatedRoomId] = useState('')
  
  // Load recent rooms from localStorage
  useEffect(() => {
    const savedRooms = localStorage.getItem('recentRooms')
    if (savedRooms) {
      setRecentRooms(JSON.parse(savedRooms))
    }
  }, [])
  
  // Save room to recent rooms
  const saveToRecentRooms = (roomId, roomName, hasPassword) => {
    const newRoom = {
      id: roomId,
      name: roomName,
      hasPassword,
      lastAccessed: new Date().toISOString()
    }
    
    const existing = recentRooms.filter(room => room.id !== roomId)
    const updated = [newRoom, ...existing].slice(0, 10) // Keep last 10 rooms
    
    setRecentRooms(updated)
    localStorage.setItem('recentRooms', JSON.stringify(updated))
  }
  
  // Handle join room
  const handleJoinRoom = async (e) => {
    e.preventDefault()
    
    if (!joinData.roomId.trim()) {
      setError('Please enter a room ID')
      return
    }
    
    if (!joinData.userName.trim()) {
      setError('Please enter your name')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Save userName to localStorage
      localStorage.setItem('userName', joinData.userName)
      
      onJoinRoom(joinData.roomId, joinData.password, joinData.userName)
      setSuccess('Joining room...')
    } catch (err) {
      setError('Failed to join room')
      setLoading(false)
    }
  }
  
  // Handle create room
  const handleCreateRoom = async (e) => {
    e.preventDefault()
    
    if (!createData.roomName.trim()) {
      setError('Please enter a room name')
      return
    }
    
    if (createData.hasPassword && !createData.password.trim()) {
      setError('Please enter a password')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const roomData = {
        roomName: createData.roomName,
        password: createData.hasPassword ? createData.password : '',
        autoDeleteHours: createData.autoDeleteHours || 24,
        hasPassword: createData.hasPassword
      }
      
      // Emit create room event
      socket.emit('create-room', roomData)
      
      // Listen for room created response
      socket.once('room-created', (data) => {
        setCreatedRoomId(data.roomId)
        setSuccess(`Room created successfully! Room ID: ${data.roomId}`)
        setLoading(false)
        
        // Save to recent rooms
        saveToRecentRooms(data.roomId, data.roomName, createData.hasPassword)
        
        // Auto-join the created room after showing the room ID
        setTimeout(() => {
          const userName = localStorage.getItem('userName') || 'Creator'
          onJoinRoom(data.roomId, createData.password, userName)
        }, 3000)
      })
      
      socket.once('error', (error) => {
        setError(error.message)
        setLoading(false)
      })
      
    } catch (err) {
      setError('Failed to create room')
      setLoading(false)
    }
  }
  
  // Join recent room
  const handleJoinRecentRoom = (room) => {
    setJoinData(prev => ({
      ...prev,
      roomId: room.id,
      password: ''
    }))
    setActiveTab('join')
  }
  
  // Handle leave room
  const handleLeaveRoom = () => {
    socket.emit('leave-room', { roomId: currentRoomId })
    onClose()
  }
  
  // Handle delete room
  const handleDeleteRoom = () => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      socket.emit('delete-room', { roomId: currentRoomId })
      onClose()
    }
  }
  
  return (
    <div className="room-manager-overlay">
      <div className="room-manager">
        <div className="room-manager-header">
          <h2>Room Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="room-manager-tabs">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Room
          </button>
          <button 
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Room
          </button>
          {currentRoomId && (
            <button 
              className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              Manage Current
            </button>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
            {createdRoomId && (
              <div className="room-id-display">
                <strong>Room ID:</strong> {createdRoomId}
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(createdRoomId)}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        )}
        
        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <span>Processing...</span>
          </div>
        )}
        
        <div className="room-manager-content">
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRoom} className="create-form">
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  value={createData.roomName}
                  onChange={(e) => setCreateData({...createData, roomName: e.target.value})}
                  placeholder="Enter room name"
                  required
                  maxLength={100}
                  className="form-input"
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createData.hasPassword}
                    onChange={(e) => setCreateData({...createData, hasPassword: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Password protect this room
                </label>
              </div>
              
              {createData.hasPassword && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={createData.password}
                    onChange={(e) => setCreateData({...createData, password: e.target.value})}
                    placeholder="Enter room password"
                    required={createData.hasPassword}
                    maxLength={100}
                    className="form-input"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Auto-delete after hours (0 = never)</label>
                <select
                  value={createData.autoDeleteHours}
                  onChange={(e) => setCreateData({...createData, autoDeleteHours: parseInt(e.target.value) || 0})}
                  className="form-select"
                >
                  <option value={0}>Never</option>
                  <option value={1}>1 Hour</option>
                  <option value={6}>6 Hours</option>
                  <option value={24}>24 Hours</option>
                  <option value={72}>3 Days</option>
                  <option value={168}>1 Week</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                Create Room
              </button>
            </form>
          )}
          
          {activeTab === 'join' && (
            <div>
              <form onSubmit={handleJoinRoom} className="join-form">
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={joinData.userName}
                    onChange={(e) => setJoinData({...joinData, userName: e.target.value})}
                    placeholder="Enter your name"
                    required
                    maxLength={50}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Room ID</label>
                  <input
                    type="text"
                    value={joinData.roomId}
                    onChange={(e) => setJoinData({...joinData, roomId: e.target.value})}
                    placeholder="Enter room ID"
                    required
                    maxLength={100}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Password (if required)</label>
                  <input
                    type="password"
                    value={joinData.password}
                    onChange={(e) => setJoinData({...joinData, password: e.target.value})}
                    placeholder="Enter room password"
                    maxLength={100}
                    className="form-input"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Join Room
                </button>
              </form>
              
              {recentRooms.length > 0 && (
                <div className="recent-rooms">
                  <h3>Recent Rooms</h3>
                  <div className="recent-rooms-list">
                    {recentRooms.map((room) => (
                      <div key={room.id} className="recent-room-item">
                        <div className="room-info">
                          <strong>{room.name}</strong>
                          <span className="room-id">{room.id}</span>
                          {room.hasPassword && <span className="password-icon">🔒</span>}
                        </div>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleJoinRecentRoom(room)}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'manage' && currentRoomId && (
            <div className="manage-room">
              <div className="current-room-info">
                <h3>Current Room</h3>
                <p><strong>Room ID:</strong> {currentRoomId}</p>
                <div className="room-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={handleLeaveRoom}
                  >
                    Leave Room
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={handleDeleteRoom}
                  >
                    Delete Room
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomManager
