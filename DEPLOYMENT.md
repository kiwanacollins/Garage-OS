# GarageOS Deployment Guide

This guide covers deploying GarageOS using Docker Compose both locally and on a VPS using Coolify.

## 🐳 Local Development with Docker

### Prerequisites

- Docker Desktop
- Git

### Quick Start

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd garage-os
   ./scripts/docker-dev.sh
   ```

2. **Manual setup (alternative):**
   ```bash
   # Copy environment file
   cp .env.docker .env
   
   # Start services
   docker compose up --build -d
   
   # Run migrations and seed
   docker compose exec api npm run db:migrate
   docker compose exec api npm run db:seed
   ```

3. **Access the application:**
   - **Web App**: http://localhost:3000
   - **API**: http://localhost:3001
   - **MailHog**: http://localhost:8025
   - **Database**: postgresql://garageos:garageos_dev@localhost:5432/garageos

### Test Credentials

- **Admin**: admin@garageos.local / Admin@1234
- **Front Desk**: frontdesk@garageos.local / FrontDesk@1234
- **Mechanic**: mechanic@garageos.local / Mechanic@1234
- **Customer**: customer@example.com / Customer@1234

### Common Commands

```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f web

# Stop services
docker compose down

# Rebuild and restart
docker compose up --build -d

# Database operations
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
docker compose exec api npm run db:studio
```

## ☁️ Production Deployment with Coolify

### Prerequisites

- VPS with Coolify installed
- Domain name(s) configured
- SMTP service for email (optional)

### Deployment Steps

1. **Create a new project in Coolify**
   - Go to your Coolify dashboard
   - Create a new project named "GarageOS"

2. **Add Git repository**
   - Add your Git repository as a resource
   - Select the main branch

3. **Configure environment variables**
   
   Copy the values from `.env.production` and set these in Coolify:

   ```bash
   # Database
   POSTGRES_USER=garageos
   POSTGRES_PASSWORD=your_secure_password_here
   POSTGRES_DB=garageos
   
   # Authentication
   JWT_SECRET=your_secure_jwt_secret_at_least_32_characters
   JWT_REFRESH_SECRET=your_secure_refresh_secret_at_least_32_characters
   
   # Server
   NODE_ENV=production
   API_PORT=3001
   LOG_LEVEL=info
   CORS_ORIGIN=https://your-domain.com
   
   # Redis
   REDIS_PASSWORD=your_secure_redis_password
   
   # File Uploads
   UPLOAD_MAX_BYTES=10485760
   UPLOAD_PUBLIC_BASE_URL=https://api.your-domain.com/uploads
   
   # Email (configure with your SMTP provider)
   SMTP_URL=smtp://username:password@smtp-server:587
   MAIL_FROM=GarageOS <no-reply@your-domain.com>
   
   # PesaPal (for payments)
   PESAPAL_BASE_URL=https://pay.pesapal.com/pesapalv3
   PESAPAL_CONSUMER_KEY=your_pesapal_key
   PESAPAL_CONSUMER_SECRET=your_pesapal_secret
   PESAPAL_CALLBACK_URL=https://your-domain.com/payment/callback
   PESAPAL_NOTIFICATION_ID=your_notification_id
   
   # Domains
   WEB_DOMAIN=your-domain.com
   API_DOMAIN=api.your-domain.com
   NEXT_PUBLIC_API_URL=https://api.your-domain.com
   ```

4. **Configure Docker Compose**
   - In Coolify, select "Docker Compose" as the build method
   - Set the compose file path to `docker-compose.prod.yml`

5. **Configure domains**
   - Set up SSL certificates for your domains
   - Configure reverse proxy routing:
     - `your-domain.com` → web service (port 3000)
     - `api.your-domain.com` → api service (port 3001)

6. **Deploy**
   - Click "Deploy" in Coolify
   - Monitor the build and deployment logs

### Post-Deployment Setup

After successful deployment:

1. **Run database migrations**:
   ```bash
   # SSH into your server or use Coolify's container shell
   docker exec -it <api-container-name> npm run db:migrate
   docker exec -it <api-container-name> npm run db:seed
   ```

2. **Verify deployment**:
   - Check that all services are running
   - Test login with admin credentials
   - Verify API endpoints are accessible

### Monitoring and Maintenance

- **View logs**: Use Coolify's log viewer or Docker logs
- **Database backups**: Set up automated PostgreSQL backups
- **Updates**: Push to your Git repository to trigger automatic deployments
- **Health checks**: Monitor the `/health` endpoints

## 🛠️ Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check PostgreSQL is running and accessible
   - Verify DATABASE_URL environment variable
   - Ensure database migrations have been run

2. **Redis connection failed**
   - Check Redis service status
   - Verify REDIS_URL and password configuration

3. **File uploads not working**
   - Check uploads directory permissions
   - Verify UPLOAD_STORAGE_DIR path exists
   - Ensure sufficient disk space

4. **Email not sending**
   - Verify SMTP_URL configuration
   - Check email service credentials
   - Test with a simple email service like MailHog first

### Debug Commands

```bash
# Check service status
docker compose ps

# View container logs
docker compose logs [service-name]

# Shell into container
docker compose exec [service-name] sh

# Check database connection
docker compose exec api node -e "
const { PrismaClient } = require('@garage-os/db');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('DB connected')).catch(console.error);
"

# Check Redis connection  
docker compose exec api node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(console.log).catch(console.error);
"
```

## 🔒 Security Considerations

- Change all default passwords and secrets
- Use strong, unique values for JWT secrets
- Enable SSL/HTTPS in production
- Regularly update Docker images
- Monitor logs for suspicious activity
- Set up proper firewall rules
- Regular database backups

## 🚀 Performance Optimization

- Configure Redis for session storage and caching
- Set up CDN for static assets
- Configure database connection pooling
- Monitor resource usage
- Set appropriate Docker resource limits