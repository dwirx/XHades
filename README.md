# Real-time Notes Application

Simple real-time collaborative notes application built with React, Node.js, and PostgreSQL.

## Features

- 🚀 Real-time collaborative editing
- 📝 Auto-save functionality
- 🔗 Easy sharing with room URLs
- 👥 User presence indicators
- 🗑️ Automatic cleanup of old notes (7 days)
- 📱 Responsive design
- 🐳 Docker support

## Technology Stack

**Frontend:**
- React 18
- Vite
- Socket.io Client
- Vanilla CSS

**Backend:**
- Node.js
- Express.js
- Socket.io
- PostgreSQL
- Rate limiting & Security

**Infrastructure:**
- Docker & Docker Compose
- PNPM Workspaces

## Quick Start

### Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start PostgreSQL:**
   ```bash
   docker-compose up postgres -d
   ```

3. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start development servers:**
   ```bash
   pnpm dev
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

### Production (Docker)

1. **Build and run:**
   ```bash
   docker-compose up -d
   ```

2. **Access application:**
   ```
   http://localhost:3000
   ```

## Usage

1. **Create a new note:**
   - Visit http://localhost:3000
   - A new room will be created automatically
   - URL will change to `/room/[room-id]`

2. **Share with others:**
   - Click "Share" button to copy the room URL
   - Anyone with the URL can join and collaborate

3. **Real-time editing:**
   - Type in the textarea
   - Changes are saved automatically
   - Other users see changes in real-time

## Project Structure

```
realtime-notes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Styles
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── database.js    # Database operations
│   │   └── socket.js      # Socket.io handlers
│   └── package.json
├── docker-compose.yml      # Docker services
├── Dockerfile             # App container
├── pnpm-workspace.yaml    # PNPM workspace config
└── package.json           # Root package.json
```

## Database Schema

```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | postgres://postgres:password@localhost:5432/realtime_notes |
| `SESSION_SECRET` | Secret for sessions | (required) |

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Docker commands
pnpm docker:up      # Start all services
pnpm docker:down    # Stop all services
```

## Features Details

### Real-time Collaboration
- Multiple users can edit the same note simultaneously
- Changes are broadcasted to all connected users
- Debounced auto-save (500ms delay)

### Auto-save
- Content is saved automatically while typing
- Database updates every 500ms after user stops typing
- Visual feedback for save status

### Room Management
- Automatic room ID generation
- URL-based room sharing
- User presence tracking

### Data Cleanup
- Notes older than 7 days are automatically deleted
- Cleanup runs every 24 hours
- Configurable retention period

### Security
- Rate limiting (100 requests/minute)
- Content size limits (1MB)
- Input sanitization
- Helmet.js security headers

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Join a room |
| `update-content` | Client → Server | Update note content |
| `load-content` | Server → Client | Load existing content |
| `update-content` | Server → Client | Broadcast content changes |
| `users-count` | Server → Client | Current users in room |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Ensure database exists

2. **Frontend not loading:**
   - Check if backend is running on port 3000
   - Verify proxy configuration in vite.config.js

3. **Socket connection issues:**
   - Check firewall settings
   - Verify CORS configuration
   - Check browser console for errors

### Performance Tips

- Use SSD storage for better database performance
- Consider Redis for caching in high-traffic scenarios
- Monitor memory usage with many concurrent users

## Roadmap

- [ ] User authentication
- [ ] Note versioning/history
- [ ] Export functionality
- [ ] Themes support
- [ ] Mobile app
- [ ] Rich text editing
- [ ] File attachments
