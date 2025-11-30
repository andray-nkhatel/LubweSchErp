# Quick Start Guide

This guide will help you get the School ERP SMS application running quickly with Docker.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (for production SSL) or use `localhost` for local testing

## Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Navigate to project directory
cd /path/to/Lubwe

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

**Minimum required values in `.env`:**
```env
POSTGRES_PASSWORD=your_secure_password
JWT_KEY=your_32_character_minimum_secret_key
DOMAIN=yourdomain.com  # or localhost for local testing
EMAIL=your-email@example.com
```

### 2. Generate Secure Keys

```bash
# Generate JWT key
openssl rand -base64 32

# Copy the output to JWT_KEY in .env
```

### 3. Update NGINX Configuration

**For local development (no SSL):**
```bash
# Use the template (HTTP only)
cp docker/nginx/nginx.conf.template docker/nginx/nginx.conf
```

**For production (with SSL):**
```bash
# Edit nginx.conf and replace REPLACE_WITH_DOMAIN with your domain
sed -i 's/REPLACE_WITH_DOMAIN/yourdomain.com/g' docker/nginx/nginx.conf
```

### 4. Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Setup SSL (Production Only)

If you're deploying to production with a domain:

```bash
# Make scripts executable
chmod +x docker/scripts/*.sh

# Initialize SSL certificates
./docker/scripts/init-letsencrypt.sh yourdomain.com your-email@example.com
```

### 6. Access Application

- **Local (HTTP):** http://localhost
- **Production (HTTPS):** https://yourdomain.com
- **API:** http://localhost/api or https://yourdomain.com/api
- **Swagger:** http://localhost/swagger (if enabled)

## Common Commands

```bash
# View logs
docker-compose logs -f

# Restart a service
docker-compose restart api

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose build && docker-compose up -d

# Check service health
docker-compose ps
```

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 80
sudo lsof -i :80

# Stop conflicting service (e.g., Apache)
sudo systemctl stop apache2
```

### Database Connection Issues

```bash
# Check database logs
docker-compose logs db

# Test connection
docker-compose exec db psql -U postgres -d SchoolDB
```

### SSL Certificate Issues

```bash
# Check certbot logs
docker-compose logs certbot

# Manually renew
docker-compose run --rm certbot renew
```

## Next Steps

- Read [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed documentation
- Configure firewall rules (see Firewall Configuration section)
- Set up backups
- Configure monitoring

## Support

For detailed information, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md).

