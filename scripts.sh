#!/bin/bash

# Real-time Notes Management Script

case "$1" in
    "dev")
        echo "Starting development servers..."
        pnpm dev
        ;;
    "build")
        echo "Building application for production..."
        pnpm build
        ;;
    "docker:dev")
        echo "Starting development with Docker (database only)..."
        docker-compose up postgres -d
        echo "Database started. You can now run 'pnpm dev' in another terminal."
        ;;
    "docker:up")
        echo "Starting application with Docker..."
        docker-compose up -d
        ;;
    "docker:down")
        echo "Stopping Docker containers..."
        docker-compose down
        ;;
    "docker:restart")
        echo "Restarting Docker containers..."
        docker-compose down
        docker-compose up -d
        ;;
    "docker:rebuild")
        echo "Rebuilding and restarting Docker containers..."
        docker-compose down
        docker-compose up --build -d
        ;;
    "docker:logs")
        echo "Showing application logs..."
        docker-compose logs -f app
        ;;
    "docker:logs:db")
        echo "Showing database logs..."
        docker-compose logs -f postgres
        ;;
    "install")
        echo "Installing dependencies..."
        pnpm install
        ;;
    "clean")
        echo "Cleaning up..."
        docker-compose down -v
        docker system prune -f
        ;;
    "help"|*)
        echo "Real-time Notes Management Script"
        echo ""
        echo "Usage: ./scripts.sh [command]"
        echo ""
        echo "Commands:"
        echo "  dev              Start development servers (requires database)"
        echo "  build            Build for production"
        echo "  install          Install dependencies"
        echo ""
        echo "Docker commands:"
        echo "  docker:dev       Start database only for development"
        echo "  docker:up        Start full application with Docker"
        echo "  docker:down      Stop all containers"
        echo "  docker:restart   Restart containers"
        echo "  docker:rebuild   Rebuild and restart containers"
        echo "  docker:logs      Show application logs"
        echo "  docker:logs:db   Show database logs"
        echo "  clean            Clean up Docker resources"
        echo ""
        echo "Examples:"
        echo "  ./scripts.sh install"
        echo "  ./scripts.sh docker:dev"
        echo "  ./scripts.sh dev"
        echo "  ./scripts.sh docker:up"
        echo ""
        ;;
esac
