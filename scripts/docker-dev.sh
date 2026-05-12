#!/bin/bash

# GarageOS Docker Development Setup Script

set -e

echo "🚀 Setting up GarageOS for Docker development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from Docker template..."
    cp .env.docker .env
    echo "✅ Created .env file. You may need to customize it for your setup."
else
    echo "📝 Using existing .env file..."
fi

# Create uploads directory
mkdir -p uploads

echo "🐳 Building and starting Docker containers..."

# Build and start all services
docker-compose up --build -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🗄️  Running database migrations..."
docker-compose exec api npm run db:migrate

echo "🌱 Seeding database..."
docker-compose exec api npm run db:seed

echo ""
echo "🎉 GarageOS is now running!"
echo ""
echo "📱 Web App:      http://localhost:3000"
echo "🔧 API:          http://localhost:3001"
echo "📧 MailHog:      http://localhost:8025"
echo "🗄️  Database:     postgresql://garageos:garageos_dev@localhost:5432/garageos"
echo ""
echo "Test credentials:"
echo "• Admin:       admin@garageos.local / Admin@1234"
echo "• Front Desk:  frontdesk@garageos.local / FrontDesk@1234"
echo "• Mechanic:    mechanic@garageos.local / Mechanic@1234"
echo "• Customer:    customer@example.com / Customer@1234"
echo ""
echo "Run 'docker-compose logs -f' to view logs"
echo "Run 'docker-compose down' to stop all services"