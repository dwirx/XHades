# HadesNotes - Advanced Real-time Collaborative Notes

A powerful, feature-rich real-time collaborative notes application with advanced security, version control, and multi-user capabilities.

## ✨ Features

### 🔄 Real-time Collaboration
- **Live Editing**: See changes as others type with sub-second latency
- **Multi-user Cursors**: Color-coded cursor tracking for each user
- **Typing Indicators**: Visual feedback when users are typing
- **Live User List**: See who's currently active in the room

### 🏠 Room Management
- **Custom Room Names**: Create rooms with descriptive names
- **Password Protection**: Secure rooms with password authentication
- **Room Persistence**: Rooms are saved and can be accessed later
- **Auto-delete Configuration**: Set automatic cleanup after specified hours

### 📝 Version Control
- **Version History**: Track all changes with timestamps
- **Easy Restoration**: Restore to any previous version
- **Author Tracking**: See who made each change
- **Conflict Resolution**: Automatic handling of concurrent edits

### 🔒 Security & Privacy
- **Content Encryption**: Optional end-to-end encryption
- **Password Hashing**: Secure bcrypt password storage
- **Input Validation**: Comprehensive sanitization
- **Rate Limiting**: Protection against abuse

### 🎨 Modern UI/UX
- **Responsive Design**: Works on all devices
- **Dark Mode Support**: Automatic theme detection
- **Connection Status**: Visual connection indicators
- **Loading States**: Smooth loading animations

### 🛠️ Technical Features
- **WebSocket Communication**: Real-time bidirectional communication
- **PostgreSQL Storage**: Reliable data persistence
- **Docker Support**: Easy deployment and scaling
- **Monorepo Structure**: Organized codebase with pnpm workspaces

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ (Alpine 3.22)
- pnpm 8+
- Docker and Docker Compose
- PostgreSQL 15+

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
   # Edit .env with your configuration
   ```

4. **Start development environment**
   ```bash
   ./start-dev.sh
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3002
- Database: PostgreSQL on port 5432

## 📁 Project Structure

```
hadesNotes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── NotesEditor.jsx
│   │   │   ├── RoomManager.jsx
│   │   │   ├── VersionHistory.jsx
│   │   │   ├── UserCursors.jsx
│   │   │   └── ActiveUsers.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── database.js     # Database operations
│   │   ├── socket.js       # WebSocket handlers
│   │   └── index.js        # Server entry point
│   └── package.json
├── docker-compose.yml      # Docker configuration
├── Dockerfile             # Container definition
├── start-dev.sh           # Development startup script
└── README.md
```

## 🔧 Development

### Available Scripts

#### Root Level
- `pnpm install` - Install all dependencies
- `pnpm run dev` - Start development servers
- `pnpm run build` - Build production bundles
- `./start-dev.sh` - Start complete development environment

#### Client
- `pnpm run --filter client dev` - Start client development server
- `pnpm run --filter client build` - Build client for production

#### Server
- `pnpm run --filter server dev` - Start server with auto-reload
- `pnpm run --filter server start` - Start server in production mode

### Database Schema

#### Notes Table
- `room_id` (VARCHAR) - Unique room identifier
- `room_name` (VARCHAR) - Human-readable room name
- `content` (TEXT) - Room content
- `password_hash` (VARCHAR) - Hashed room password
- `has_password` (BOOLEAN) - Password protection flag
- `is_encrypted` (BOOLEAN) - Content encryption flag
- `auto_delete_hours` (INTEGER) - Auto-cleanup timer
- `created_at` (TIMESTAMP) - Creation timestamp
- `last_accessed` (TIMESTAMP) - Last access timestamp
- `created_by` (VARCHAR) - Creator identifier

#### Version History Table
- `room_id` (VARCHAR) - Reference to notes table
- `content` (TEXT) - Version content
- `version_number` (INTEGER) - Sequential version number
- `created_at` (TIMESTAMP) - Version timestamp
- `created_by` (VARCHAR) - Version author

#### User Sessions Table
- `room_id` (VARCHAR) - Reference to notes table
- `user_id` (VARCHAR) - Unique user identifier
- `user_name` (VARCHAR) - Display name
- `cursor_position` (INTEGER) - Cursor position
- `selection_start` (INTEGER) - Selection start
- `selection_end` (INTEGER) - Selection end
- `color` (VARCHAR) - User color
- `last_seen` (TIMESTAMP) - Last activity timestamp

## 🌐 API Endpoints

### WebSocket Events

#### Client → Server
- `join-room` - Join a room with credentials
- `create-room` - Create a new room
- `leave-room` - Leave current room
- `delete-room` - Delete a room
- `update-content` - Update room content
- `cursor-update` - Update cursor position
- `get-version-history` - Retrieve version history
- `restore-version` - Restore from version
- `typing` - Send typing indicator

#### Server → Client
- `load-content` - Initial room content
- `update-content` - Content updates
- `users-count` - Active user count
- `active-users` - Active user list
- `cursor-update` - User cursor updates
- `user-typing` - Typing notifications
- `version-history` - Version history data
- `room-created` - Room creation confirmation
- `room-deleted` - Room deletion notification
- `room-password-required` - Password prompt
- `error` - Error messages

### REST Endpoints
- `GET /health` - Health check
- `GET /api/health` - API health status

## 🔒 Security Features

### Authentication & Authorization
- Room-based access control
- Password protection with bcrypt hashing
- User session management
- Input validation and sanitization

### Rate Limiting
- Request rate limiting per IP
- WebSocket connection limits
- Database query optimization

### Data Protection
- Optional content encryption (AES-256)
- Secure password storage
- SQL injection prevention
- XSS protection

## 🚢 Deployment

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgres://user:password@host:5432/database
   ENCRYPTION_KEY=your-encryption-key
   SESSION_SECRET=your-session-secret
   ```

### Production Considerations

- Use a reverse proxy (nginx/Apache)
- Set up SSL/TLS certificates
- Configure database backups
- Monitor performance metrics
- Set up logging and alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with React, Node.js, and PostgreSQL
- Real-time communication powered by Socket.io
- Styling with modern CSS
- Development tools: Vite, pnpm, Docker

## 📞 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

**HadesNotes** - Where collaboration meets innovation! 🚀
