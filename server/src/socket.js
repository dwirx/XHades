import { 
  getNote, 
  updateNote, 
  updateLastAccessed, 
  getRoomInfo, 
  verifyRoomPassword,
  saveVersion,
  getVersionHistory,
  updateUserCursor,
  getActiveUsers,
  removeUserFromRoom,
  createRoom,
  deleteRoom,
  pool
} from './database.js'
import { v4 as uuidv4 } from 'uuid'

const roomUsers = new Map() // Track users per room
const userColors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6610f2', '#e83e8c', '#fd7e14']

// Generate random color for user
const generateUserColor = () => {
  return userColors[Math.floor(Math.random() * userColors.length)]
}

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)
    
    // Generate unique user ID and color
    socket.userId = uuidv4()
    socket.userColor = generateUserColor()
    socket.userName = `User_${socket.id.substring(0, 6)}`
    
    // Create room
    socket.on('create-room', async (data) => {
      try {
        const { roomName, password, autoDeleteHours, hasPassword } = data
        
        // Validate input
        if (!roomName || typeof roomName !== 'string' || roomName.length < 1) {
          socket.emit('error', { message: 'Invalid room name' })
          return
        }
        
        if (hasPassword && (!password || password.length < 1)) {
          socket.emit('error', { message: 'Password is required' })
          return
        }
        
        // Create room
        const roomId = await createRoom(
          roomName,
          hasPassword ? password : null,
          autoDeleteHours || 0,
          socket.userName
        )
        
        socket.emit('room-created', { roomId, roomName })
        
        console.log(`Room created: ${roomId} (${roomName}) by ${socket.userName}`)
      } catch (error) {
        console.error('Error creating room:', error)
        socket.emit('error', { message: 'Failed to create room' })
      }
    })
    
    // Join room with password verification
    socket.on('join-room', async (data) => {
      try {
        const { roomId, password, userName } = data
        
        // Validate room ID
        if (!roomId || typeof roomId !== 'string' || roomId.length < 3) {
          socket.emit('error', { message: 'Invalid room ID' })
          return
        }
        
        // Get room info
        const roomInfo = await getRoomInfo(roomId)
        if (!roomInfo) {
          socket.emit('error', { message: 'Room not found' })
          return
        }
        
        // Verify password if required
        if (roomInfo.has_password) {
          const isPasswordValid = await verifyRoomPassword(roomId, password)
          if (!isPasswordValid) {
            socket.emit('room-password-required', { roomId })
            return
          }
        }
        
        // Join the room
        socket.join(roomId)
        socket.roomId = roomId
        socket.userName = userName || socket.userName
        
        // Track user in room
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map())
        }
        roomUsers.get(roomId).set(socket.id, {
          userId: socket.userId,
          userName: socket.userName,
          color: socket.userColor,
          socketId: socket.id
        })
        
        // Update user cursor in database
        await updateUserCursor(roomId, socket.userId, socket.userName, 0, 0, 0, socket.userColor)
        
        // Update last accessed
        await updateLastAccessed(roomId)
        
        // Load existing content
        const note = await getNote(roomId)
        socket.emit('load-content', { 
          content: note?.content || '', 
          roomInfo: {
            name: roomInfo.room_name,
            hasPassword: roomInfo.has_password,
            autoDeleteHours: roomInfo.auto_delete_hours
          }
        })
        
        // Send active users to all users in room
        const activeUsers = await getActiveUsers(roomId)
        io.to(roomId).emit('active-users', activeUsers)
        
        // Broadcast users count
        const userCount = roomUsers.get(roomId).size
        io.to(roomId).emit('users-count', userCount)
        
        console.log(`User ${socket.userName} (${socket.id}) joined room ${roomId}`)
      } catch (error) {
        console.error('Error joining room:', error)
        socket.emit('error', { message: 'Failed to join room' })
      }
    })
    
    // Leave room
    socket.on('leave-room', async (data) => {
      try {
        const { roomId } = data
        
        if (roomId && socket.roomId === roomId) {
          socket.leave(roomId)
          
          // Remove from room tracking
          if (roomUsers.has(roomId)) {
            roomUsers.get(roomId).delete(socket.id)
            
            // Update users count
            const userCount = roomUsers.get(roomId).size
            io.to(roomId).emit('users-count', userCount)
            
            // Clean up empty rooms
            if (userCount === 0) {
              roomUsers.delete(roomId)
            }
          }
          
          // Remove from database
          await removeUserFromRoom(roomId, socket.userId)
          
          socket.roomId = null
          console.log(`User ${socket.userName} left room ${roomId}`)
        }
      } catch (error) {
        console.error('Error leaving room:', error)
        socket.emit('error', { message: 'Failed to leave room' })
      }
    })
    
    // Delete room
    socket.on('delete-room', async (data) => {
      try {
        const { roomId } = data
        
        if (!roomId || socket.roomId !== roomId) {
          socket.emit('error', { message: 'Access denied' })
          return
        }
        
        // Remove all users from room
        if (roomUsers.has(roomId)) {
          roomUsers.delete(roomId)
        }
        
        // Notify all users in room
        io.to(roomId).emit('room-deleted', { roomId })
        
        // Delete from database
        await deleteRoom(roomId)
        
        console.log(`Room ${roomId} deleted by ${socket.userName}`)
      } catch (error) {
        console.error('Error deleting room:', error)
        socket.emit('error', { message: 'Failed to delete room' })
      }
    })
    
    // Update content with version history
    socket.on('update-content', async (data) => {
      try {
        const { roomId, content, shouldEncrypt } = data
        
        // Validate input
        if (!roomId || typeof content !== 'string') {
          socket.emit('error', { message: 'Invalid data' })
          return
        }
        
        // Limit content size (1MB)
        if (content.length > 1024 * 1024) {
          socket.emit('error', { message: 'Content too large' })
          return
        }
        
        // Update in database
        const updatedNote = await updateNote(roomId, content, shouldEncrypt)
        
        // Save version every 10 changes or significant edits
        if (Math.random() < 0.1) { // 10% chance to save version
          await saveVersion(roomId, content, socket.userName)
        }
        
        // Broadcast to other users in the room
        socket.to(roomId).emit('update-content', { 
          content: updatedNote.content,
          updatedBy: socket.userName,
          isEncrypted: updatedNote.is_encrypted
        })
        
        console.log(`Content updated in room ${roomId} by ${socket.userName}`)
      } catch (error) {
        console.error('Error updating content:', error)
        socket.emit('error', { message: 'Failed to update content' })
      }
    })
    
    // Handle cursor position updates
    socket.on('cursor-update', async (data) => {
      try {
        const { roomId, cursorPosition, selectionStart, selectionEnd } = data
        
        if (!roomId || socket.roomId !== roomId) return
        
        // Update cursor in database
        await updateUserCursor(
          roomId, 
          socket.userId, 
          socket.userName, 
          cursorPosition, 
          selectionStart || cursorPosition, 
          selectionEnd || cursorPosition,
          socket.userColor
        )
        
        // Broadcast cursor update to other users
        socket.to(roomId).emit('cursor-update', {
          userId: socket.userId,
          userName: socket.userName,
          color: socket.userColor,
          cursorPosition,
          selectionStart,
          selectionEnd
        })
      } catch (error) {
        console.error('Error updating cursor:', error)
      }
    })
    
    // Get version history
    socket.on('get-version-history', async (data) => {
      try {
        const { roomId, limit = 10 } = data
        
        if (!roomId || socket.roomId !== roomId) {
          socket.emit('error', { message: 'Access denied' })
          return
        }
        
        const versions = await getVersionHistory(roomId, limit)
        socket.emit('version-history', versions)
      } catch (error) {
        console.error('Error getting version history:', error)
        socket.emit('error', { message: 'Failed to get version history' })
      }
    })
    
    // Restore from version
    socket.on('restore-version', async (data) => {
      try {
        const { roomId, versionId } = data
        
        if (!roomId || socket.roomId !== roomId) {
          socket.emit('error', { message: 'Access denied' })
          return
        }
        
        // Get version content
        const { pool } = await import('./database.js')
        const versionResult = await pool.query(
          'SELECT content FROM note_versions WHERE id = $1 AND room_id = $2',
          [versionId, roomId]
        )
        
        if (versionResult.rows.length === 0) {
          socket.emit('error', { message: 'Version not found' })
          return
        }
        
        const versionContent = versionResult.rows[0].content
        
        // Update current note
        await updateNote(roomId, versionContent)
        
        // Broadcast to all users in room
        io.to(roomId).emit('update-content', { 
          content: versionContent,
          updatedBy: socket.userName,
          isRestored: true
        })
        
        console.log(`Version restored in room ${roomId} by ${socket.userName}`)
      } catch (error) {
        console.error('Error restoring version:', error)
        socket.emit('error', { message: 'Failed to restore version' })
      }
    })
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data
      if (roomId && socket.roomId === roomId) {
        socket.to(roomId).emit('user-typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping
        })
      }
    })
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      
      // Remove user from room tracking
      if (socket.roomId && roomUsers.has(socket.roomId)) {
        roomUsers.get(socket.roomId).delete(socket.id)
        
        // Remove from database
        removeUserFromRoom(socket.roomId, socket.userId)
        
        // Update users count
        const userCount = roomUsers.get(socket.roomId).size
        io.to(socket.roomId).emit('users-count', userCount)
        
        // Update active users
        getActiveUsers(socket.roomId).then(activeUsers => {
          io.to(socket.roomId).emit('active-users', activeUsers)
        })
        
        // Clean up empty rooms
        if (userCount === 0) {
          roomUsers.delete(socket.roomId)
        }
      }
    })
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })
  
  // Heartbeat to keep connections alive
  setInterval(() => {
    io.emit('ping')
  }, 30000) // 30 seconds
}
