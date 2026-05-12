#!/bin/bash

# GarageOS Infrastructure-only Docker Setup
# This starts only the infrastructure services (Postgres, Redis, MailHog) 
# and runs the applications in development mode on the host

set -e

echo "🚀 Setting up GarageOS infrastructure services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ Created .env file. You may need to customize it for your setup."
else
    echo "📝 Using existing .env file..."
fi

# Create uploads directory
mkdir -p uploads

echo "🐳 Starting infrastructure services..."

# Start only infrastructure services
docker-compose -f docker-compose.simple.yml up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🗄️  Running database migrations..."
npm run db:migrate

echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "🎉 Infrastructure is ready!"
echo ""
echo "🔧 Infrastructure Services:"
echo "• PostgreSQL:  postgresql://garageos:garageos_dev@localhost:5432/garageos"
echo "• Redis:       redis://localhost:6379"  
echo "• MailHog:     http://localhost:8025"
echo ""
echo "🚀 Now start your applications:"
echo "• API:         npm run dev --workspace=@garage-os/api"
echo "• Web:         npm run dev --workspace=@garage-os/web"
echo "• Queue:       npm run dev --workspace=@garage-os/queue"
echo ""
echo "Or use: npm run dev (starts API + Web)"
echo ""
echo "Test credentials:"
echo "• Admin:       admin@garageos.local / Admin@1234"
echo "• Front Desk:  frontdesk@garageos.local / FrontDesk@1234"
echo "• Mechanic:    mechanic@garageos.local / Mechanic@1234"
echo "• Customer:    customer@example.com / Customer@1234"