import pg from 'pg'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/realtime_notes',
  ssl: false // Disable SSL for simplicity
})

export { pool }

// Encryption functions
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-cbc'

export const encryptContent = (content) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  let encrypted = cipher.update(content, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export const decryptContent = (encryptedContent) => {
  try {
    const [ivHex, encrypted] = encryptedContent.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedContent
  }
}

export const initDatabase = async () => {
  try {
    // Create notes table with enhanced features
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) UNIQUE NOT NULL,
        room_name VARCHAR(255) DEFAULT '',
        content TEXT DEFAULT '',
        password_hash VARCHAR(255) DEFAULT NULL,
        has_password BOOLEAN DEFAULT FALSE,
        is_encrypted BOOLEAN DEFAULT FALSE,
        auto_delete_hours INTEGER DEFAULT 168,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255) DEFAULT 'anonymous'
      )
    `)
    
    // Create version history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS note_versions (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255) DEFAULT 'anonymous',
        FOREIGN KEY (room_id) REFERENCES notes(room_id) ON DELETE CASCADE
      )
    `)
    
    // Create user sessions table for cursor tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) DEFAULT 'Anonymous',
        cursor_position INTEGER DEFAULT 0,
        selection_start INTEGER DEFAULT 0,
        selection_end INTEGER DEFAULT 0,
        color VARCHAR(7) DEFAULT '#007bff',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_id),
        FOREIGN KEY (room_id) REFERENCES notes(room_id) ON DELETE CASCADE
      )
    `)
    
    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_room_id ON notes(room_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_last_accessed ON notes(last_accessed)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_note_versions_room_id ON note_versions(room_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_room_id ON user_sessions(room_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)
    `)
    
    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// Create a new room
export const createRoom = async (roomName, password = null, autoDeleteHours = 0, createdBy = 'anonymous') => {
  const roomId = Math.random().toString(36).substring(2, 15)
  const hasPassword = password !== null && password !== ''
  const hashedPassword = hasPassword ? await bcrypt.hash(password, 10) : null
  
  const result = await pool.query(
    `INSERT INTO notes (room_id, room_name, has_password, password_hash, auto_delete_hours, content, created_by) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING room_id`,
    [roomId, roomName, hasPassword, hashedPassword, autoDeleteHours, '', createdBy]
  )
  
  return result.rows[0].room_id
}

// Verify room password
export const verifyRoomPassword = async (roomId, password) => {
  try {
    const result = await pool.query(
      'SELECT password_hash FROM notes WHERE room_id = $1',
      [roomId]
    )
    
    if (result.rows.length === 0) {
      return false
    }
    
    const { password_hash } = result.rows[0]
    
    if (!password_hash) {
      return true // No password required
    }
    
    return await bcrypt.compare(password, password_hash)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

// Get room info
export const getRoomInfo = async (roomId) => {
  try {
    const result = await pool.query(
      'SELECT room_id, room_name, password_hash IS NOT NULL as has_password, auto_delete_hours, created_at, created_by FROM notes WHERE room_id = $1',
      [roomId]
    )
    
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting room info:', error)
    throw error
  }
}

// Delete a room and all related data
export const deleteRoom = async (roomId) => {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Delete version history
    await client.query('DELETE FROM note_versions WHERE room_id = $1', [roomId])
    
    // Delete user sessions
    await client.query('DELETE FROM user_sessions WHERE room_id = $1', [roomId])
    
    // Delete the note
    await client.query('DELETE FROM notes WHERE room_id = $1', [roomId])
    
    await client.query('COMMIT')
    
    console.log(`Room ${roomId} deleted successfully`)
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error deleting room:', error)
    throw error
  } finally {
    client.release()
  }
}

// List all rooms
export const listRooms = async () => {
  try {
    const result = await pool.query(
      `SELECT room_id, room_name, password_hash IS NOT NULL as has_password, 
              auto_delete_hours, created_at, created_by, last_accessed
       FROM notes ORDER BY last_accessed DESC`
    )
    
    return result.rows
  } catch (error) {
    console.error('Error listing rooms:', error)
    throw error
  }
}

// Save version history
export const saveVersion = async (roomId, content, createdBy = 'anonymous') => {
  try {
    // Get current version number
    const versionResult = await pool.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM note_versions WHERE room_id = $1',
      [roomId]
    )
    
    const nextVersion = versionResult.rows[0].next_version
    
    const result = await pool.query(
      'INSERT INTO note_versions (room_id, content, version_number, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomId, content, nextVersion, createdBy]
    )
    
    return result.rows[0]
  } catch (error) {
    console.error('Error saving version:', error)
    throw error
  }
}

// Get version history
export const getVersionHistory = async (roomId, limit = 10) => {
  try {
    const result = await pool.query(
      'SELECT * FROM note_versions WHERE room_id = $1 ORDER BY version_number DESC LIMIT $2',
      [roomId, limit]
    )
    
    return result.rows
  } catch (error) {
    console.error('Error getting version history:', error)
    throw error
  }
}

// Update user cursor position
export const updateUserCursor = async (roomId, userId, userName, cursorPosition, selectionStart, selectionEnd, color) => {
  try {
    const result = await pool.query(
      `INSERT INTO user_sessions (room_id, user_id, user_name, cursor_position, selection_start, selection_end, color, last_seen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (room_id, user_id) DO UPDATE SET
       cursor_position = $4, selection_start = $5, selection_end = $6, color = $7, last_seen = CURRENT_TIMESTAMP
       RETURNING *`,
      [roomId, userId, userName, cursorPosition, selectionStart, selectionEnd, color]
    )
    
    return result.rows[0]
  } catch (error) {
    console.error('Error updating user cursor:', error)
    throw error
  }
}

// Get active users in room
export const getActiveUsers = async (roomId) => {
  try {
    // Clean up old sessions (older than 30 seconds)
    await pool.query(
      'DELETE FROM user_sessions WHERE last_seen < NOW() - INTERVAL \'30 seconds\''
    )
    
    const result = await pool.query(
      'SELECT * FROM user_sessions WHERE room_id = $1 ORDER BY last_seen DESC',
      [roomId]
    )
    
    return result.rows
  } catch (error) {
    console.error('Error getting active users:', error)
    throw error
  }
}

// Remove user from room
export const removeUserFromRoom = async (roomId, userId) => {
  try {
    await pool.query(
      'DELETE FROM user_sessions WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    )
  } catch (error) {
    console.error('Error removing user from room:', error)
    throw error
  }
}

// Enhanced cleanup with custom auto-delete hours
export const cleanupExpiredNotes = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM notes 
       WHERE last_accessed < NOW() - (auto_delete_hours * INTERVAL '1 hour')
       RETURNING room_id, room_name`
    )
    
    console.log(`Cleaned up ${result.rows.length} expired notes`)
    return result.rows
  } catch (error) {
    console.error('Error cleaning up expired notes:', error)
    throw error
  }
}

// Update existing functions to handle encryption
export const getNote = async (roomId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE room_id = $1',
      [roomId]
    )
    
    if (result.rows.length === 0) {
      // Create new note if doesn't exist
      const createResult = await pool.query(
        'INSERT INTO notes (room_id, content) VALUES ($1, $2) RETURNING *',
        [roomId, '']
      )
      return createResult.rows[0]
    }
    
    const note = result.rows[0]
    
    // Decrypt content if encrypted
    if (note.is_encrypted && note.content) {
      note.content = decryptContent(note.content)
    }
    
    return note
  } catch (error) {
    console.error('Error getting note:', error)
    throw error
  }
}

export const updateNote = async (roomId, content, shouldEncrypt = false) => {
  try {
    let finalContent = content
    
    if (shouldEncrypt) {
      finalContent = encryptContent(content)
    }
    
    const result = await pool.query(
      `UPDATE notes 
       SET content = $1, last_accessed = CURRENT_TIMESTAMP, is_encrypted = $3
       WHERE room_id = $2 
       RETURNING *`,
      [finalContent, roomId, shouldEncrypt]
    )
    
    if (result.rows.length === 0) {
      // Create new note if doesn't exist
      const createResult = await pool.query(
        'INSERT INTO notes (room_id, content, is_encrypted) VALUES ($1, $2, $3) RETURNING *',
        [roomId, finalContent, shouldEncrypt]
      )
      return createResult.rows[0]
    }
    
    const note = result.rows[0]
    
    // Decrypt content for return if encrypted
    if (note.is_encrypted && note.content) {
      note.content = decryptContent(note.content)
    }
    
    return note
  } catch (error) {
    console.error('Error updating note:', error)
    throw error
  }
}

export const updateLastAccessed = async (roomId) => {
  try {
    await pool.query(
      'UPDATE notes SET last_accessed = CURRENT_TIMESTAMP WHERE room_id = $1',
      [roomId]
    )
  } catch (error) {
    console.error('Error updating last accessed:', error)
    throw error
  }
}

// Health check function
export const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT NOW()')
    return { status: 'healthy', timestamp: result.rows[0].now }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { status: 'unhealthy', error: error.message }
  }
}
