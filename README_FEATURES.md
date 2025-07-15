# HadesNotes - Real-time Collaborative Notes Application

## ✨ Features Implemented

### 🎨 Modern Light Mode Design
- **Clean UI**: Beautiful, modern interface with light mode only design
- **Gradient Headers**: Attractive gradient styling for headers and buttons
- **Responsive Design**: Works perfectly on both desktop and mobile devices
- **Smooth Animations**: Smooth transitions and hover effects throughout the app

### 🏠 Room Management System
- **Create Rooms**: Easy room creation with custom names and settings
- **Join Rooms**: Simple room joining with room ID
- **Room Persistence**: All rooms are saved to database with proper storage
- **Recent Rooms**: Recent rooms are stored locally for quick access
- **Password Protection**: Optional password protection for rooms
- **Auto-delete**: Configurable auto-delete timers (1 hour, 6 hours, 24 hours, 3 days, 1 week)

### 🔐 Security Features
- **Password Hashing**: Secure password storage using bcrypt
- **Content Encryption**: Optional content encryption for sensitive notes
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: Built-in rate limiting to prevent abuse

### 👥 Real-time Collaboration
- **Live Editing**: Real-time collaborative editing with Socket.io
- **User Cursors**: See other users' cursor positions in real-time
- **Typing Indicators**: Visual indicators when users are typing
- **Active Users**: See who's currently in the room
- **User Colors**: Each user gets a unique color for identification

### 📝 Advanced Editor Features
- **Version History**: Track and restore previous versions of notes
- **Auto-save**: Automatic saving as you type
- **Full-screen Editor**: Distraction-free writing experience
- **Syntax Highlighting**: Monospace font for code-friendly editing

### 🗃️ Data Management
- **PostgreSQL Database**: Robust database storage with proper schema
- **Local Storage**: Recent rooms and user preferences stored locally
- **Room Statistics**: Track room creation, last accessed, and usage

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- pnpm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hadesNotes
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start PostgreSQL**
   ```bash
   # Using Docker
   docker-compose up -d postgres
   
   # Or use your local PostgreSQL instance
   ```

5. **Run the application**
   ```bash
   # Start both client and server
   pnpm run dev
   
   # Or start individually
   pnpm --filter server dev  # Backend (port 3002)
   pnpm --filter client dev  # Frontend (port 5173)
   ```

## 🎯 Usage

### Creating a Room
1. Click "Create Room" tab on the welcome screen
2. Enter a room name
3. Optionally set a password
4. Choose auto-delete timer (or never)
5. Click "Create Room"
6. Share the generated Room ID with others

### Joining a Room
1. Click "Join Room" tab on the welcome screen
2. Enter your name
3. Enter the Room ID
4. Enter password if required
5. Click "Join Room"

### Collaborative Editing
- Start typing to see real-time collaboration in action
- See other users' cursors and typing indicators
- Use the toolbar to access room management and version history

## 🏗️ Architecture

### Frontend (React + Vite)
- **Components**: Modular React components for different features
- **State Management**: React hooks for local state management
- **Real-time**: Socket.io-client for WebSocket connections
- **Styling**: Modern CSS with gradients and animations

### Backend (Node.js + Express)
- **API Server**: Express.js server with Socket.io integration
- **Database**: PostgreSQL with proper relational schema
- **Authentication**: Password hashing and session management
- **Real-time**: Socket.io for WebSocket communication

### Database Schema
```sql
-- Notes table (main room data)
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) UNIQUE NOT NULL,
  room_name VARCHAR(255) DEFAULT '',
  content TEXT DEFAULT '',
  has_password BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  auto_delete_hours INTEGER DEFAULT 0,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(255) DEFAULT 'anonymous',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Version history
CREATE TABLE note_versions (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) REFERENCES notes(room_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by VARCHAR(255) DEFAULT 'anonymous',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) REFERENCES notes(room_id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  cursor_position INTEGER DEFAULT 0,
  selection_start INTEGER DEFAULT 0,
  selection_end INTEGER DEFAULT 0,
  user_color VARCHAR(7) DEFAULT '#007bff',
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ Technical Improvements

### Performance Optimizations
- **Debounced Updates**: Cursor and content updates are debounced
- **Efficient Queries**: Optimized database queries with proper indexing
- **Connection Pooling**: PostgreSQL connection pooling for better performance
- **Memory Management**: Proper cleanup of Socket.io connections

### Error Handling
- **Comprehensive Validation**: Input validation on both client and server
- **Graceful Degradation**: Fallback behaviors for network issues
- **User-friendly Messages**: Clear error messages for users
- **Logging**: Proper server-side logging for debugging

### Security Measures
- **Password Hashing**: bcrypt for secure password storage
- **Content Encryption**: Optional AES-256 encryption for sensitive content
- **Input Sanitization**: Prevent XSS and injection attacks
- **Rate Limiting**: Prevent abuse and DoS attacks

## 🎨 Design Features

### Modern UI Elements
- **Gradient Backgrounds**: Beautiful gradient headers and buttons
- **Rounded Corners**: Consistent border-radius throughout
- **Shadow Effects**: Subtle shadows for depth and modern look
- **Hover Effects**: Interactive hover states for better UX

### Responsive Design
- **Mobile-First**: Designed to work perfectly on mobile devices
- **Flexible Layouts**: Responsive grid and flexbox layouts
- **Touch-Friendly**: Large touch targets for mobile users
- **Adaptive Text**: Proper font sizes across different screen sizes

### Accessibility
- **High Contrast**: Good color contrast for readability
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators

## 🔧 Development Features

### Development Tools
- **Hot Reload**: Instant updates during development
- **ESLint**: Code linting for consistency
- **Prettier**: Code formatting
- **Nodemon**: Auto-restart server on changes

### Debugging
- **Console Logging**: Comprehensive logging for debugging
- **Error Boundaries**: React error boundaries for graceful error handling
- **Network Debugging**: Socket.io debugging support
- **Database Logging**: Query logging for database operations

## 📱 Browser Support

### Supported Browsers
- **Chrome**: Latest version
- **Firefox**: Latest version
- **Safari**: Latest version
- **Edge**: Latest version
- **Mobile Browsers**: iOS Safari, Chrome Mobile

### Required Features
- **WebSocket Support**: For real-time functionality
- **LocalStorage**: For recent rooms and preferences
- **Modern CSS**: CSS Grid, Flexbox, CSS Variables
- **ES6+**: Modern JavaScript features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Socket.io for real-time communication
- PostgreSQL for robust data storage
- React and Vite for modern frontend development
- bcrypt for secure password hashing

---

**HadesNotes** - Real-time collaborative notes made simple and beautiful! 🚀
