#!/bin/bash

# GarageOS Production Deployment Script
# Builds all services locally, then starts with Docker Compose

set -e

echo "🚀 Building GarageOS for production deployment..."

# Check if required environment variables exist
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it from the template."
    echo "   Copy .env.production and fill in your actual values."
    exit 1
fi

# Copy production environment
echo "📝 Using production environment..."
cp .env.production .env

echo "📦 Installing dependencies..."
npm install --production=false

echo "🔧 Building shared packages..."
npm run build --workspace=@garage-os/db
npm run build --workspace=@garage-os/shared-types
npm run build --workspace=@garage-os/validation

echo "🏗️  Building applications..."
npm run build --workspace=@garage-os/api
npm run build --workspace=@garage-os/web
npm run build --workspace=@garage-os/queue

echo "🐳 Building and starting containers..."
docker-compose -f docker-compose.prod.yml build --parallel
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 15

echo "🗄️  Running migrations and seeding..."
docker-compose -f docker-compose.prod.yml run --rm migrate

echo "🚀 Starting application services..."
docker-compose -f docker-compose.prod.yml up -d api web queue-worker

echo ""
echo "🎉 GarageOS Production is now running!"
echo ""
echo "📱 Services:"
echo "• Web App:     Available on configured domain"
echo "• API:         Available on configured API domain"  
echo "• Queue:       Running in background"
echo "• PostgreSQL:  Internal network"
echo "• Redis:       Internal network"
echo ""
echo "📊 Monitor with:"
echo "• docker-compose -f docker-compose.prod.yml ps"
echo "• docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Stop with:"
echo "• docker-compose -f docker-compose.prod.yml down"