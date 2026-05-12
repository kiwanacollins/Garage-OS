#!/bin/bash

# GarageOS Simple Docker Development Setup

set -e

echo "🚀 Setting up GarageOS with simplified Docker approach..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from Docker template..."
    cp .env.docker .env
    echo "✅ Created .env file."
else
    echo "📝 Using existing .env file..."
fi

# Create uploads directory
mkdir -p uploads

echo "🐳 Building and starting services..."

# Build and start services
docker-compose -f docker-compose.dev.yml up --build -d postgres redis mailhog

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🐳 Building application container..."
docker-compose -f docker-compose.dev.yml build app

echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.dev.yml run --rm app npm run db:migrate

echo "🌱 Seeding database..."
docker-compose -f docker-compose.dev.yml run --rm app npm run db:seed

echo "🚀 Starting application services..."
docker-compose -f docker-compose.dev.yml up -d app web

echo ""
echo "🎉 GarageOS is now running!"
echo ""
echo "📱 Web App:      http://localhost:3000"
echo "🔧 API:          http://localhost:3001"
echo "📧 MailHog:      http://localhost:8025"
echo ""
echo "Test credentials:"
echo "• Admin:       admin@garageos.local / Admin@1234"
echo "• Front Desk:  frontdesk@garageos.local / FrontDesk@1234"
echo "• Mechanic:    mechanic@garageos.local / Mechanic@1234"
echo "• Customer:    customer@example.com / Customer@1234"
echo ""
echo "Useful commands:"
echo "• View logs:           docker-compose -f docker-compose.dev.yml logs -f"
echo "• Stop services:       docker-compose -f docker-compose.dev.yml down"
echo "• Restart app:         docker-compose -f docker-compose.dev.yml restart app"
echo "• Shell into app:      docker-compose -f docker-compose.dev.yml exec app sh"