#!/bin/bash

# Loveli Deployment Scripts
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying Loveli to $ENVIRONMENT environment..."

cd "$PROJECT_ROOT"

# Check if required tools are installed
check_requirements() {
    echo "🔍 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    echo "✅ Requirements met"
}

# Build the application
build_app() {
    echo "🏗️ Building application..."
    
    # Clean previous builds
    rm -rf .next
    
    # Install dependencies
    npm ci
    
    # Build the application
    npm run build
    
    echo "✅ Build completed"
}

# Deploy to Vercel
deploy_vercel() {
    echo "🚀 Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy to Vercel
    vercel --prod
    
    echo "✅ Vercel deployment completed"
}

# Deploy with Docker
deploy_docker() {
    echo "🐳 Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        exit 1
    fi
    
    # Build Docker image
    docker build -t loveli:$ENVIRONMENT .
    
    # Stop existing container
    docker stop loveli-app 2>/dev/null || true
    docker rm loveli-app 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name loveli-app \
        --restart unless-stopped \
        -p 3000:3000 \
        -e NODE_ENV=production \
        -e DATABASE_URL="$DATABASE_URL" \
        -e REDIS_URL="$REDIS_URL" \
        -e OPENAI_API_KEY="$OPENAI_API_KEY" \
        -e HUGGINGFACE_TOKEN="$HUGGINGFACE_TOKEN" \
        loveli:$ENVIRONMENT
    
    echo "✅ Docker deployment completed"
}

# Deploy WebSocket server
deploy_websocket() {
    echo "🔌 Deploying WebSocket server..."
    
    # Stop existing container
    docker stop loveli-ws 2>/dev/null || true
    docker rm loveli-ws 2>/dev/null || true
    
    # Run WebSocket server
    docker run -d \
        --name loveli-ws \
        --restart unless-stopped \
        -p 3001:3001 \
        -e NODE_ENV=production \
        -e DATABASE_URL="$DATABASE_URL" \
        -e REDIS_URL="$REDIS_URL" \
        -e WS_PORT=3001 \
        -e OPENAI_API_KEY="$OPENAI_API_KEY" \
        -e HUGGINGFACE_TOKEN="$HUGGINGFACE_TOKEN" \
        loveli:$ENVIRONMENT \
        node server.js
    
    echo "✅ WebSocket server deployed"
}

# Main deployment logic
main() {
    check_requirements
    build_app
    
    case $ENVIRONMENT in
        "vercel")
            deploy_vercel
            ;;
        "docker")
            deploy_docker
            deploy_websocket
            ;;
        "production"|"prod")
            deploy_docker
            deploy_websocket
            ;;
        *)
            echo "❌ Unknown environment: $ENVIRONMENT"
            echo "Available environments: vercel, docker, production"
            exit 1
            ;;
    esac
    
    echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
}

# Run main function
main "$@"
