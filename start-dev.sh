#!/bin/bash

# HadesNotes Development Start Script
echo "🚀 Starting HadesNotes Development Environment..."

# Kill existing processes on ports
echo "📦 Stopping existing processes..."
pkill -f "node.*3002" 2>/dev/null || true
pkill -f "vite.*5173" 2>/dev/null || true

# Start PostgreSQL if not running
echo "🐘 Starting PostgreSQL..."
cd /home/hades/homelabs/dev/testing/hadesNotes
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Start server in background
echo "🔧 Starting server on port 3002..."
pnpm run --filter server dev &
SERVER_PID=$!

# Wait for server to initialize
sleep 3

# Start client in background
echo "🎨 Starting client on port 5173..."
pnpm run --filter client dev &
CLIENT_PID=$!

# Wait for client to initialize
sleep 3

echo "
✅ HadesNotes is now running!

🌍 Frontend: http://localhost:5173
🔗 Backend:  http://localhost:3002
🐘 Database: PostgreSQL on port 5432

📝 Features Available:
• Real-time collaborative editing
• Room management with password protection
• Multi-user cursor tracking
• Version history
• Auto-delete configuration
• Content encryption
• Typing indicators

🛠️ Development Commands:
• Press Ctrl+C to stop all services
• Server auto-reloads on changes
• Client auto-reloads on changes

🎯 Ready to use! Create or join a room to start collaborating.
"

# Function to handle cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null || true
    docker-compose down
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
