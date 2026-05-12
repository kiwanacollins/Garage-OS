# GarageOS Docker Setup Guide

This guide provides multiple approaches to run GarageOS with Docker, from simple infrastructure-only setups to full containerization.

## 🚀 Quick Start Options

### Option 1: Infrastructure Only (Recommended for Development)

Start only the database and supporting services with Docker, run apps natively:

```bash
# Start infrastructure services
npm run docker:infra

# Then run applications natively  
npm run dev
```

This approach:
- ✅ Fast development with hot reload
- ✅ Easy debugging
- ✅ Native performance
- ✅ Simple setup

### Option 2: Simple Containerized Development

Run everything in containers with development-friendly configuration:

```bash
npm run docker:dev:simple
```

This approach:
- ✅ Complete isolation
- ✅ Consistent environment
- ✅ Volume mounting for live updates
- ⚠️ Slightly slower file watching

### Option 3: Full Production-like Containers

Multi-stage builds optimized for production:

```bash
npm run docker:dev
```

This approach:
- ✅ Production-like environment
- ✅ Optimized builds
- ⚠️ Longer build times
- ⚠️ Need rebuild for code changes

## 📋 Prerequisites

1. **Docker Desktop** installed and running
2. **Node.js 20+** (for Option 1)
3. **Git** for cloning

## 🔧 Detailed Setup Instructions

### Option 1: Infrastructure Only Setup

1. **Start infrastructure**:
   ```bash
   ./scripts/docker-infra-only.sh
   ```

2. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

3. **Start development servers**:
   ```bash
   # Start both API and Web
   npm run dev
   
   # Or individually
   npm run dev --workspace=@garage-os/api    # Port 3001
   npm run dev --workspace=@garage-os/web    # Port 3000
   npm run dev --workspace=@garage-os/queue  # Background worker
   ```

### Option 2: Simple Containerized Setup

1. **One command setup**:
   ```bash
   ./scripts/docker-dev-simple.sh
   ```

2. **Manual steps** (alternative):
   ```bash
   # Copy environment
   cp .env.docker .env
   
   # Start infrastructure
   docker-compose -f docker-compose.dev.yml up -d postgres redis mailhog
   
   # Build app container
   docker-compose -f docker-compose.dev.yml build app
   
   # Run migrations
   docker-compose -f docker-compose.dev.yml run --rm app npm run db:migrate
   docker-compose -f docker-compose.dev.yml run --rm app npm run db:seed
   
   # Start applications
   docker-compose -f docker-compose.dev.yml up -d app web
   ```

### Option 3: Full Containerized Setup

1. **Quick setup**:
   ```bash
   ./scripts/docker-dev.sh
   ```

2. **Manual steps** (if script fails):
   ```bash
   # Fix dependencies first
   npm install
   
   # Copy environment
   cp .env.docker .env
   
   # Build and start
   docker-compose build
   docker-compose up -d
   
   # Wait for DB, then migrate
   sleep 10
   docker-compose exec api npm run db:migrate
   docker-compose exec api npm run db:seed
   ```

## 🌐 Accessing the Application

Once running, access:

- **Web Application**: http://localhost:3000
- **API Documentation**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/v1/health  
- **Email Testing**: http://localhost:8025 (MailHog)
- **Database**: postgresql://garageos:garageos_dev@localhost:5432/garageos

### Test Credentials

- **Admin**: admin@garageos.local / Admin@1234
- **Front Desk**: frontdesk@garageos.local / FrontDesk@1234  
- **Mechanic**: mechanic@garageos.local / Mechanic@1234
- **Customer**: customer@example.com / Customer@1234

## 🛠️ Common Commands

### Infrastructure Only
```bash
# Start/stop infrastructure
docker-compose -f docker-compose.simple.yml up -d
docker-compose -f docker-compose.simple.yml down

# View infrastructure logs
docker-compose -f docker-compose.simple.yml logs -f
```

### Simple Containerized
```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f web

# Restart services
docker-compose -f docker-compose.dev.yml restart app web

# Shell into containers
docker-compose -f docker-compose.dev.yml exec app sh
docker-compose -f docker-compose.dev.yml exec web sh

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Full Containerized
```bash
# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart api
docker-compose restart web

# Shell into containers
docker-compose exec api sh
docker-compose exec web sh

# Stop all services
docker-compose down
```

### Database Operations
```bash
# Run migrations (choose based on your setup)
npm run db:migrate                                                    # Option 1
docker-compose -f docker-compose.dev.yml run --rm app npm run db:migrate  # Option 2  
docker-compose exec api npm run db:migrate                            # Option 3

# Seed database
npm run db:seed                                                       # Option 1
docker-compose -f docker-compose.dev.yml run --rm app npm run db:seed     # Option 2
docker-compose exec api npm run db:seed                               # Option 3

# Database studio
npm run db:studio                                                     # Option 1
docker-compose -f docker-compose.dev.yml run --rm -p 5555:5555 app npm run db:studio  # Option 2
docker-compose exec api npm run db:studio                             # Option 3 (need port forwarding)
```

## 🐛 Troubleshooting

### Docker Not Running
```bash
# Check Docker status
docker info

# Start Docker Desktop and try again
```

### Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache  # For older docker-compose
docker-compose build --pull      # Alternative
```

### Database Connection Issues
```bash
# Check if Postgres is running
docker-compose ps postgres

# Check Postgres logs
docker-compose logs postgres

# Restart Postgres
docker-compose restart postgres
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000  # Web
lsof -i :3001  # API
lsof -i :5432  # Postgres

# Kill processes or change ports in docker-compose.yml
```

### Package Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### File Permission Issues (Linux/Mac)
```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with current user ID
docker-compose run --user $(id -u):$(id -g) app npm install
```

## 🔄 Switching Between Setups

### From Infrastructure-only to Full Container
```bash
# Stop native processes (Ctrl+C)
# Stop infrastructure
docker-compose -f docker-compose.simple.yml down

# Start full setup
npm run docker:dev:simple
```

### From Container to Infrastructure-only  
```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down
# or
docker-compose down

# Start infrastructure only
npm run docker:infra

# Start native development
npm run dev
```

## 📁 File Structure

```
├── docker-compose.yml           # Full production-ready setup
├── docker-compose.dev.yml       # Simple development setup  
├── docker-compose.simple.yml    # Infrastructure only
├── docker-compose.prod.yml      # Production deployment (Coolify)
├── Dockerfile                   # Multi-stage production build
├── Dockerfile.single            # Single-stage development build
├── .dockerignore               # Docker build exclusions
├── .env.docker                 # Docker environment template
├── .env.production            # Production environment template
└── scripts/
    ├── docker-dev.sh          # Full container setup
    ├── docker-dev-simple.sh   # Simple container setup
    └── docker-infra-only.sh   # Infrastructure only setup
```

## 🚀 Production Deployment

For production deployment on your VPS with Coolify, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 💡 Tips

1. **Start with Option 1** (infrastructure-only) for fastest development
2. **Use Option 2** when you need environment consistency  
3. **Use Option 3** to test production-like builds
4. **Keep containers running** - they restart automatically
5. **Monitor logs** regularly to catch issues early
6. **Backup your database** before major changes