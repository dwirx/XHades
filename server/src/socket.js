import { getNote, updateNote, updateLastAccessed } from './database.js'

const roomUsers = new Map() // Track users per room

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)
    
    socket.on('join-room', async (roomId) => {
      try {
        // Validate room ID
        if (!roomId || typeof roomId !== 'string' || roomId.length < 3) {
          socket.emit('error', { message: 'Invalid room ID' })
          return
        }
        
        // Join the room
        socket.join(roomId)
        socket.roomId = roomId
        
        // Track user in room
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Set())
        }
        roomUsers.get(roomId).add(socket.id)
        
        // Update last accessed
        await updateLastAccessed(roomId)
        
        // Load existing content
        const note = await getNote(roomId)
        socket.emit('load-content', { content: note.content })
        
        // Broadcast users count
        const userCount = roomUsers.get(roomId).size
        io.to(roomId).emit('users-count', userCount)
        
        console.log(`User ${socket.id} joined room ${roomId}`)
      } catch (error) {
        console.error('Error joining room:', error)
        socket.emit('error', { message: 'Failed to join room' })
      }
    })
    
    socket.on('update-content', async (data) => {
      try {
        const { roomId, content } = data
        
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
        await updateNote(roomId, content)
        
        // Broadcast to other users in the room
        socket.to(roomId).emit('update-content', { content })
        
        console.log(`Content updated in room ${roomId}`)
      } catch (error) {
        console.error('Error updating content:', error)
        socket.emit('error', { message: 'Failed to update content' })
      }
    })
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      
      // Remove user from room tracking
      if (socket.roomId && roomUsers.has(socket.roomId)) {
        roomUsers.get(socket.roomId).delete(socket.id)
        
        // Update users count
        const userCount = roomUsers.get(socket.roomId).size
        io.to(socket.roomId).emit('users-count', userCount)
        
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
