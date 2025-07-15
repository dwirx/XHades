import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/realtime_notes',
  ssl: false // Disable SSL for simplicity
})

export const initDatabase = async () => {
  try {
    // Create notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) UNIQUE NOT NULL,
        content TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create index on room_id for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_room_id ON notes(room_id)
    `)
    
    // Create index on last_accessed for cleanup queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_last_accessed ON notes(last_accessed)
    `)
    
    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

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
    
    return result.rows[0]
  } catch (error) {
    console.error('Error getting note:', error)
    throw error
  }
}

export const updateNote = async (roomId, content) => {
  try {
    const result = await pool.query(
      `UPDATE notes 
       SET content = $1, last_accessed = CURRENT_TIMESTAMP 
       WHERE room_id = $2 
       RETURNING *`,
      [content, roomId]
    )
    
    if (result.rows.length === 0) {
      // Create new note if doesn't exist
      const createResult = await pool.query(
        'INSERT INTO notes (room_id, content) VALUES ($1, $2) RETURNING *',
        [roomId, content]
      )
      return createResult.rows[0]
    }
    
    return result.rows[0]
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

export const cleanupOldNotes = async () => {
  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE last_accessed < NOW() - INTERVAL \'7 days\' RETURNING room_id'
    )
    
    console.log(`Cleaned up ${result.rows.length} old notes`)
    return result.rows.length
  } catch (error) {
    console.error('Error cleaning up old notes:', error)
    throw error
  }
}

// Schedule cleanup every 24 hours
setInterval(cleanupOldNotes, 24 * 60 * 60 * 1000)

export default pool
