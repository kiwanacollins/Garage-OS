http://localhost:3000/admin

Admin: admin@garageos.local / Admin@1234
Front desk: frontdesk@garageos.local / FrontDesk@1234
Mechanic: mechanic@garageos.local / Mechanic@1234
Customer: customer@example.com / Customer@1234


# 🚀 Quick Start (Choose one approach)

## Option 1: Docker Infrastructure + Native Apps (Recommended)
```bash
npm run docker:infra    # Start DB, Redis, MailHog with Docker
npm run dev             # Run apps natively for fast development
```

## Option 2: Full Docker Setup
```bash 
npm run docker:dev:simple    # Everything in containers with hot reload
```

## Option 3: Traditional Setup
```bash
npm run infra:up        # start Redis + MailHog
# Ensure Postgres is running with garageos user/db
npm run db:migrate
npm run db:seed
npm run dev
```

📖 **Detailed Setup Guide**: See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for comprehensive Docker instructions.

🚀 **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment with Coolify.