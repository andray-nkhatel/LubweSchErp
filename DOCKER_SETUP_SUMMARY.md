# Docker Containerization Setup Summary

This document summarizes the complete Docker containerization setup for the School ERP SMS application.

## What Was Created

### 1. Dockerfiles

#### API Dockerfile (`docker/api/Dockerfile`)
- Multi-stage build for ASP.NET Core 9.0 API
- Builds and publishes the application
- Creates necessary directories for Media, Reports, and logs
- Exposes port 8080 internally

#### Client Dockerfile (`docker/client/Dockerfile`)
- Multi-stage build for Vue 3 application
- Uses Node.js 20 Alpine for building
- Builds with `VITE_API_BASE_URL=/api` to avoid CORS issues
- Serves static files with NGINX Alpine
- Includes custom NGINX configuration for the client

### 2. Docker Compose Configuration

#### Main Compose File (`docker-compose.yml`)
Orchestrates 5 services:

1. **PostgreSQL Database** (`db`)
   - PostgreSQL 16 Alpine
   - Persistent data volume
   - Health checks enabled
   - Internal network only

2. **ASP.NET Core API** (`api`)
   - Built from `docker/api/Dockerfile`
   - Connects to PostgreSQL
   - Environment variables for configuration
   - Volume mounts for Media, Reports, and logs
   - Health check endpoint at `/health`

3. **Vue 3 Client** (`client`)
   - Built from `docker/client/Dockerfile`
   - Serves static files via NGINX
   - Configured to use `/api` for API calls

4. **NGINX Reverse Proxy** (`nginx`)
   - Handles SSL termination
   - Proxies `/api` requests to backend
   - Serves Vue client static files
   - Redirects HTTP to HTTPS
   - Automatic SSL certificate detection

5. **Certbot** (`certbot`)
   - Automatic Let's Encrypt certificate renewal
   - Runs every 12 hours
   - Webroot validation method

### 3. NGINX Configurations

#### Main Reverse Proxy (`docker/nginx/nginx.conf`)
- HTTPS server with SSL/TLS configuration
- HTTP to HTTPS redirect
- API proxying with rate limiting
- Static file serving with caching
- Security headers
- Let's Encrypt challenge handling

#### Template Configuration (`docker/nginx/nginx.conf.template`)
- HTTP-only configuration for initial setup
- Used before SSL certificates are obtained
- Automatically replaced when certificates are available

#### Client Configuration (`docker/client/nginx-client.conf`)
- Serves Vue static files
- SPA routing support (try_files)
- Gzip compression
- Static asset caching

### 4. Scripts

#### SSL Initialization (`docker/scripts/init-letsencrypt.sh`)
- Automated Let's Encrypt certificate setup
- Handles initial certificate request
- Updates NGINX configuration
- Restarts services

#### Certificate Renewal (`docker/scripts/renew-certificates.sh`)
- Manual certificate renewal
- Reloads NGINX after renewal

### 5. Configuration Files

#### Environment Template (`.env.example`)
- Database configuration
- JWT settings
- Domain and email for SSL
- Copy to `.env` and fill in values

#### Docker Ignore (`.dockerignore`)
- Excludes unnecessary files from Docker builds
- Reduces build context size
- Improves build performance

### 6. Documentation

#### Deployment Guide (`DOCKER_DEPLOYMENT.md`)
- Complete deployment instructions
- Environment setup
- SSL certificate management
- Firewall configuration
- Troubleshooting guide

#### Quick Start (`QUICK_START.md`)
- 5-minute setup guide
- Essential commands
- Common troubleshooting

## Architecture Overview

```
Internet
   │
   ├─ Port 80 (HTTP) ──┐
   │                   │
   └─ Port 443 (HTTPS)─┼─► NGINX Reverse Proxy
                       │   (SSL Termination)
                       │
                       ├─► /api/* ──► ASP.NET Core API (port 8080)
                       │              └─► PostgreSQL Database
                       │
                       └─► /* ──────► Vue Client (port 80)
                                      (Static Files)
```

## Key Features

### 1. **No CORS Issues**
- Vue client uses relative path `/api`
- NGINX proxies to backend
- Same origin for all requests

### 2. **SSL/HTTPS Support**
- Automatic Let's Encrypt certificates
- Automatic renewal every 12 hours
- HTTP to HTTPS redirect
- Strong SSL/TLS configuration

### 3. **Security**
- Database not exposed externally
- Rate limiting on API endpoints
- Security headers
- Internal Docker network

### 4. **Production Ready**
- Health checks for all services
- Automatic restarts
- Persistent data volumes
- Logging configuration

### 5. **Environment Flexibility**
- Environment variables for configuration
- Works in local development
- Works in production
- Easy to customize

## Environment Variables

### Required
- `POSTGRES_PASSWORD`: Database password
- `JWT_KEY`: JWT signing key (min 32 chars)
- `DOMAIN`: Your domain name (for SSL)
- `EMAIL`: Email for Let's Encrypt

### Optional
- `POSTGRES_DB`: Database name (default: SchoolDB)
- `POSTGRES_USER`: Database user (default: postgres)
- `JWT_ISSUER`: JWT issuer (default: SUBLIME SCHOOL ERP)
- `JWT_AUDIENCE`: JWT audience (default: SUBLIME SCHOOL ERP)

## Ports

- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (main access)
- **8080**: API (internal only)
- **5432**: PostgreSQL (internal only)

## Volumes

- `db_data`: PostgreSQL data persistence
- `certbot-www`: Let's Encrypt webroot
- `certbot-conf`: SSL certificates
- `./SchoolERPSMS/Media`: API media files
- `./SchoolERPSMS/Reports`: Generated reports
- `./logs`: Application logs

## Network

All services run on a private Docker bridge network (`app-network`):
- Services can communicate by name
- No external access except through NGINX
- Database is completely internal

## Deployment Flow

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Update NGINX Configuration**
   ```bash
   # Replace domain in nginx.conf
   sed -i 's/REPLACE_WITH_DOMAIN/yourdomain.com/g' docker/nginx/nginx.conf
   ```

3. **Start Services**
   ```bash
   docker-compose up -d --build
   ```

4. **Setup SSL** (Production)
   ```bash
   ./docker/scripts/init-letsencrypt.sh yourdomain.com your-email@example.com
   ```

5. **Configure Firewall**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

## Maintenance

### View Logs
```bash
docker-compose logs -f [service-name]
```

### Restart Service
```bash
docker-compose restart [service-name]
```

### Update Application
```bash
docker-compose build [service-name]
docker-compose up -d [service-name]
```

### Backup Database
```bash
docker-compose exec db pg_dump -U postgres SchoolDB > backup.sql
```

### Renew SSL Certificates
```bash
./docker/scripts/renew-certificates.sh
```

## Notes

1. **Database**: Currently uses PostgreSQL. To use SQL Server, see DOCKER_DEPLOYMENT.md.

2. **Local Development**: Use `nginx.conf.template` for HTTP-only local development.

3. **Port Conflicts**: If ports 80/443 are in use, stop conflicting services (Apache, etc.).

4. **Health Checks**: API has `/health` endpoint for monitoring.

5. **Automatic Renewal**: Certbot automatically renews certificates every 12 hours.

## Next Steps

1. Review `DOCKER_DEPLOYMENT.md` for detailed instructions
2. Set up your `.env` file
3. Configure your domain DNS
4. Deploy to your VPS
5. Set up firewall rules
6. Configure backups
7. Set up monitoring (optional)

## Support

For issues:
1. Check service logs: `docker-compose logs`
2. Verify environment variables
3. Check firewall configuration
4. Review documentation in `DOCKER_DEPLOYMENT.md`

