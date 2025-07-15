#!/bin/bash

# HadesNotes Build and Deploy Script
echo "🚀 Starting HadesNotes Build and Deploy Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose is not installed. Docker deployment will be skipped."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

# Step 1: Clean previous builds
print_status "Cleaning previous builds..."
rm -rf client/dist/
rm -rf server/dist/

# Step 2: Install dependencies
print_status "Installing dependencies..."
pnpm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Build client
print_status "Building client application..."
pnpm --filter client build

if [ $? -ne 0 ]; then
    print_error "Failed to build client"
    exit 1
fi

# Step 4: Build server (if needed)
print_status "Building server application..."
pnpm --filter server build

if [ $? -ne 0 ]; then
    print_error "Failed to build server"
    exit 1
fi

# Step 5: Test the build
print_status "Testing the build..."
if [ ! -d "client/dist" ]; then
    print_error "Client build directory not found"
    exit 1
fi

if [ ! -f "client/dist/index.html" ]; then
    print_error "Client build is incomplete"
    exit 1
fi

print_status "Build completed successfully!"

# Step 6: Docker build (if requested)
if [ "$1" == "--docker" ] && [ "$DOCKER_AVAILABLE" == true ]; then
    print_status "Building Docker image..."
    
    # Stop existing containers
    docker-compose down
    
    # Build new image
    docker-compose build --no-cache
    
    if [ $? -ne 0 ]; then
        print_error "Docker build failed"
        exit 1
    fi
    
    print_status "Docker image built successfully!"
    
    # Step 7: Start containers
    print_status "Starting containers..."
    docker-compose up -d
    
    if [ $? -ne 0 ]; then
        print_error "Failed to start containers"
        exit 1
    fi
    
    print_status "Containers started successfully!"
    print_status "Application is available at: http://localhost:3003"
    
    # Show container status
    echo ""
    print_status "Container Status:"
    docker-compose ps
    
elif [ "$1" == "--docker" ] && [ "$DOCKER_AVAILABLE" == false ]; then
    print_warning "Docker is not available. Skipping Docker deployment."
fi

# Step 8: Development mode (if requested)
if [ "$1" == "--dev" ]; then
    print_status "Starting development servers..."
    
    # Start PostgreSQL if available
    if [ "$DOCKER_AVAILABLE" == true ]; then
        print_status "Starting PostgreSQL container..."
        docker-compose up -d postgres
        sleep 5
    fi
    
    # Start development servers
    print_status "Starting development servers..."
    pnpm run dev
fi

# Step 9: Production mode (if requested)
if [ "$1" == "--prod" ]; then
    print_status "Starting production server..."
    
    # Start PostgreSQL if available
    if [ "$DOCKER_AVAILABLE" == true ]; then
        print_status "Starting PostgreSQL container..."
        docker-compose up -d postgres
        sleep 5
    fi
    
    # Set production environment
    export NODE_ENV=production
    export PORT=3003
    
    # Start production server
    print_status "Starting production server on port 3003..."
    pnpm start
fi

print_status "✅ Build and deploy process completed successfully!"

echo ""
echo "🎉 HadesNotes is ready!"
echo ""
echo "Available commands:"
echo "  ./deploy.sh --dev      Start development servers"
echo "  ./deploy.sh --prod     Start production server"
echo "  ./deploy.sh --docker   Build and deploy with Docker"
echo ""
echo "URLs:"
echo "  Development: http://localhost:5173"
echo "  Production:  http://localhost:3003"
echo ""
