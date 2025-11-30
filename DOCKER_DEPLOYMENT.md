# Docker Deployment Guide

This guide provides complete instructions for containerizing and deploying the School ERP SMS application using Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Firewall Configuration](#firewall-configuration)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain name pointing to your VPS (for SSL)
- VPS with root/sudo access

## Project Structure

```
Lubwe/
├── docker/
│   ├── api/
│   │   └── Dockerfile
│   ├── client/
│   │   ├── Dockerfile
│   │   └── nginx-client.conf
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── nginx.conf.template
│   └── scripts/
│       ├── init-letsencrypt.sh
│       └── renew-certificates.sh
├── docker-compose.yml
├── .env.example
└── DOCKER_DEPLOYMENT.md
```

## Environment Setup

### 1. Create Environment File

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
POSTGRES_DB=SchoolDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_KEY=your_jwt_secret_key_here_minimum_32_characters
JWT_ISSUER=SUBLIME SCHOOL ERP
JWT_AUDIENCE=SUBLIME SCHOOL ERP

# Domain Configuration (for SSL certificates)
DOMAIN=yourdomain.com
EMAIL=your-email@example.com

# API Configuration
ASPNETCORE_ENVIRONMENT=Production
```

**Important Security Notes:**
- Use a strong, random password for `POSTGRES_PASSWORD`
- Generate a secure random key for `JWT_KEY` (minimum 32 characters)
- Never commit `.env` to version control

### 2. Generate JWT Key

You can generate a secure JWT key using:

```bash
# Linux/Mac
openssl rand -base64 32

# Or using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Local Development

### Running Without SSL (HTTP only)

For local development, you can run without SSL certificates:

1. **Update nginx configuration for local use:**

   Edit `docker/nginx/nginx.conf` and comment out SSL sections, or use the template:

   ```bash
   cp docker/nginx/nginx.conf.template docker/nginx/nginx.conf
   ```

2. **Start services:**

   ```bash
   docker-compose up -d
   ```

3. **Access the application:**

   - Frontend: http://localhost
   - API: http://localhost/api
   - Swagger: http://localhost/swagger (if enabled)

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build api
docker-compose build client
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f nginx
docker-compose logs -f client
```

### Stopping Services

```bash
docker-compose down

# Remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Production Deployment

### 1. Prepare Your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes to take effect
```

### 2. Clone and Configure

```bash
# Clone your repository
git clone <your-repo-url>
cd Lubwe

# Create .env file
cp .env.example .env
nano .env  # Edit with your values
```

### 3. Update NGINX Configuration

Before starting, update the domain in `docker/nginx/nginx.conf`:

```bash
# Replace REPLACE_WITH_DOMAIN with your actual domain
sed -i 's/REPLACE_WITH_DOMAIN/yourdomain.com/g' docker/nginx/nginx.conf
```

Or manually edit the file and replace `REPLACE_WITH_DOMAIN` with your domain.

### 4. Initial SSL Certificate Setup

**Option A: Automated Script**

```bash
# Make script executable
chmod +x docker/scripts/init-letsencrypt.sh

# Run initialization (replace with your domain and email)
./docker/scripts/init-letsencrypt.sh yourdomain.com your-email@example.com
```

**Option B: Manual Setup**

1. Start services without SSL:

   ```bash
   # Use template configuration
   cp docker/nginx/nginx.conf.template docker/nginx/nginx.conf
   docker-compose up -d nginx
   ```

2. Request certificate:

   ```bash
   docker-compose run --rm certbot certonly \
       --webroot \
       --webroot-path=/var/www/certbot \
       --email your-email@example.com \
       --agree-tos \
       --no-eff-email \
       -d yourdomain.com
   ```

3. Update nginx configuration:

   ```bash
   # Restore full nginx.conf
   git checkout docker/nginx/nginx.conf
   # Or manually update domain in nginx.conf
   sed -i 's/REPLACE_WITH_DOMAIN/yourdomain.com/g' docker/nginx/nginx.conf
   ```

4. Restart nginx:

   ```bash
   docker-compose restart nginx
   ```

### 5. Start All Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## SSL Certificate Setup

### Automatic Renewal

The `certbot` service in `docker-compose.yml` automatically renews certificates every 12 hours. Certificates are valid for 90 days, so this ensures they're always renewed in time.

### Manual Renewal

If you need to manually renew certificates:

```bash
# Make script executable
chmod +x docker/scripts/renew-certificates.sh

# Run renewal
./docker/scripts/renew-certificates.sh
```

Or directly:

```bash
docker-compose run --rm certbot renew --webroot --webroot-path=/var/www/certbot
docker-compose exec nginx nginx -s reload
```

### Certificate Verification

Check certificate status:

```bash
docker-compose exec certbot certbot certificates
```

## Firewall Configuration

### Ubuntu/Debian (UFW)

```bash
# Allow SSH (IMPORTANT: do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### CentOS/RHEL (firewalld)

```bash
# Allow SSH
sudo firewall-cmd --permanent --add-service=ssh

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

### Cloud Provider Security Groups

If using AWS, Azure, GCP, or other cloud providers:

1. **AWS Security Groups:**
   - Inbound Rule: HTTP (port 80) from 0.0.0.0/0
   - Inbound Rule: HTTPS (port 443) from 0.0.0.0/0
   - Inbound Rule: SSH (port 22) from your IP only

2. **Azure Network Security Groups:**
   - Allow inbound on port 80 (HTTP)
   - Allow inbound on port 443 (HTTPS)
   - Allow inbound on port 22 (SSH) from your IP

3. **GCP Firewall Rules:**
   ```bash
   gcloud compute firewall-rules create allow-http \
       --allow tcp:80 \
       --source-ranges 0.0.0.0/0 \
       --target-tags http-server

   gcloud compute firewall-rules create allow-https \
       --allow tcp:443 \
       --source-ranges 0.0.0.0/0 \
       --target-tags https-server
   ```

### Testing Firewall

```bash
# From your local machine, test if ports are open
telnet your-vps-ip 80
telnet your-vps-ip 443

# Or using curl
curl -I http://yourdomain.com
curl -I https://yourdomain.com
```

## Environment Variables

### Vue Client Configuration

The Vue client is configured to use `/api` as the base URL, which is proxied by NGINX to the backend. This is set during the Docker build process.

**For local development:**
- Set `VITE_API_BASE_URL=/api` in your `.env.local` file
- The Vite dev server will proxy `/api` requests to the backend

**For production:**
- The build argument `VITE_API_BASE_URL=/api` is set in `docker-compose.yml`
- This ensures the client uses relative paths, avoiding CORS issues

### API Configuration

The API reads configuration from:
1. Environment variables (set in `docker-compose.yml`)
2. `appsettings.json` (defaults)

Key environment variables:
- `ConnectionStrings__DefaultConnection`: Database connection string
- `Jwt__Key`: JWT signing key
- `Jwt__Issuer`: JWT issuer
- `Jwt__Audience`: JWT audience
- `ASPNETCORE_ENVIRONMENT`: Environment (Production/Development)

## Troubleshooting

### Database Connection Issues

```bash
# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec db psql -U postgres -d SchoolDB

# Check if database is healthy
docker-compose ps db
```

### API Not Starting

```bash
# Check API logs
docker-compose logs api

# Check if API is healthy
docker-compose exec api wget -O- http://localhost:8080/health

# Restart API
docker-compose restart api
```

### NGINX Issues

```bash
# Check NGINX logs
docker-compose logs nginx

# Test NGINX configuration
docker-compose exec nginx nginx -t

# Reload NGINX
docker-compose exec nginx nginx -s reload
```

### SSL Certificate Issues

```bash
# Check certbot logs
docker-compose logs certbot

# Verify certificate exists
docker-compose exec certbot ls -la /etc/letsencrypt/live/

# Test certificate renewal
docker-compose run --rm certbot renew --dry-run
```

### CORS Issues

If you encounter CORS errors:
1. Ensure the Vue client uses `/api` as the base URL (relative path)
2. Check that NGINX is properly proxying `/api` requests
3. Verify the API's CORS configuration in `Program.cs`

### Port Already in Use

If ports 80 or 443 are already in use:

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service (e.g., Apache)
sudo systemctl stop apache2
# Or
sudo systemctl stop httpd
```

### Container Health Checks Failing

```bash
# Check container status
docker-compose ps

# Inspect specific container
docker inspect school_api
docker inspect school_db

# View health check logs
docker inspect --format='{{json .State.Health}}' school_api | jq
```

### Database Migrations

The API automatically runs migrations on startup. If migrations fail:

```bash
# Check API logs for migration errors
docker-compose logs api | grep -i migration

# Manually run migrations (if needed)
docker-compose exec api dotnet ef database update
```

### Rebuilding After Code Changes

```bash
# Rebuild specific service
docker-compose build api
docker-compose up -d api

# Rebuild all services
docker-compose build
docker-compose up -d
```

### Clearing Everything and Starting Fresh

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean Docker system (WARNING: removes all unused resources)
docker system prune -a --volumes

# Start fresh
docker-compose up -d --build
```

## Maintenance

### Regular Tasks

1. **Monitor logs regularly:**
   ```bash
   docker-compose logs -f --tail=100
   ```

2. **Check certificate expiration:**
   ```bash
   docker-compose exec certbot certbot certificates
   ```

3. **Backup database:**
   ```bash
   docker-compose exec db pg_dump -U postgres SchoolDB > backup.sql
   ```

4. **Update images:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Backup Strategy

1. **Database backups:**
   ```bash
   # Create backup script
   #!/bin/bash
   BACKUP_DIR="/path/to/backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   docker-compose exec -T db pg_dump -U postgres SchoolDB > "$BACKUP_DIR/backup_$DATE.sql"
   ```

2. **Volume backups:**
   ```bash
   # Backup Docker volumes
   docker run --rm -v school_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz /data
   ```

## Additional Notes

### Using SQL Server Instead of PostgreSQL

If you prefer SQL Server:

1. Replace the `db` service in `docker-compose.yml`:
   ```yaml
   db:
     image: mcr.microsoft.com/mssql/server:2022-latest
     environment:
       - ACCEPT_EULA=Y
       - SA_PASSWORD=${SQL_SERVER_PASSWORD}
       - MSSQL_PID=Express
   ```

2. Update connection string in `.env`:
   ```
   ConnectionStrings__DefaultConnection=Server=db;Database=SchoolDB;User Id=sa;Password=${SQL_SERVER_PASSWORD};TrustServerCertificate=True;
   ```

3. Update `Program.cs` to use SQL Server instead of PostgreSQL.

### Performance Tuning

1. **Database connection pooling:** Already configured in the API
2. **NGINX caching:** Static assets are cached for 1 year
3. **Rate limiting:** Configured in NGINX to prevent abuse

### Monitoring

Consider adding monitoring tools:
- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Docker monitoring: `docker stats`

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review this documentation
3. Check Docker and Docker Compose versions
4. Verify firewall and security group configurations

