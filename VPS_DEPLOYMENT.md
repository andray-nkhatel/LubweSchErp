# VPS Deployment Guide

This guide walks you through deploying the School ERP SMS application to your VPS server.

## Prerequisites

- VPS with Ubuntu 20.04+ (or similar Linux distribution)
- Root or sudo access
- Domain name pointing to your VPS IP address
- SSH access to your VPS

## Step 1: Prepare Your VPS

### 1.1 Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### 1.2 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

## Step 2: Transfer Your Code to VPS

### Option A: Using Git (Recommended)

```bash
# On your VPS
cd /opt  # or wherever you want to store the app
sudo git clone <your-repository-url> lubwe
cd lubwe

# If using private repo, set up SSH keys or use HTTPS with credentials
```

### Option B: Using SCP (from your local machine)

```bash
# From your local machine
scp -r /home/andrea/Documents/Sources/Lubwe root@your-vps-ip:/opt/lubwe

# Or using rsync (excludes node_modules, dist, etc.)
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  /home/andrea/Documents/Sources/Lubwe/ root@your-vps-ip:/opt/lubwe/
```

### Option C: Using tar and scp

```bash
# On your local machine
cd /home/andrea/Documents/Sources
tar -czf lubwe.tar.gz --exclude='node_modules' --exclude='dist' --exclude='.git' Lubwe
scp lubwe.tar.gz root@your-vps-ip:/opt/

# On your VPS
cd /opt
tar -xzf lubwe.tar.gz
mv Lubwe lubwe
cd lubwe
```

## Step 3: Set Up Environment Variables

### 3.1 Create .env File

```bash
cd /opt/lubwe  # or wherever you placed the code
nano .env
```

### 3.2 Configure Environment Variables

Add the following content (replace with your actual values):

```env
```

### 3.3 Generate Secure Passwords

```bash
# Generate PostgreSQL password
openssl rand -base64 32

# Generate JWT key
openssl rand -base64 32
```

**Important:** Keep your `.env` file secure and never commit it to version control!

## Step 4: Configure Firewall

### 4.1 Allow Required Ports

```bash
# If using UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### 4.2 If Using Cloud Provider Firewall

Make sure to allow inbound traffic on ports:
- **22** (SSH)
- **80** (HTTP - for Let's Encrypt)
- **443** (HTTPS)

## Step 5: Initial Deployment (Without SSL)

For the first deployment, we'll start without SSL to ensure everything works, then add SSL.

### 5.1 Build and Start Containers

```bash
cd /opt/lubwe

# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### 5.2 Verify Services Are Running

```bash
# Check container status
docker-compose ps

# Check individual service logs
docker-compose logs api
docker-compose logs client
docker-compose logs nginx
docker-compose logs db
```

### 5.3 Test the Application

```bash
# Test API health
curl http://localhost/api/health

# Test from your browser
# Visit: http://your-vps-ip
```

## Step 6: Set Up SSL Certificates

### 6.1 Ensure Domain Points to Your VPS

Make sure your domain's A record points to your VPS IP:

```bash
# Check DNS
dig yourdomain.com
# or
nslookup yourdomain.com
```

### 6.2 Update Domain in .env

```bash
nano .env
# Set DOMAIN=yourdomain.com
```

### 6.3 Obtain SSL Certificate

The Certbot container will automatically obtain certificates, but you need to ensure:

1. Port 80 is accessible from the internet
2. Your domain points to the VPS IP
3. The domain is accessible

```bash
# Restart nginx to use the updated domain
docker-compose restart nginx

# Check certbot logs
docker-compose logs certbot

# Manually trigger certificate request (if needed)
docker-compose exec certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com
```

### 6.4 Restart Services

After certificates are obtained:

```bash
docker-compose restart nginx
```

The nginx container will automatically detect the certificates and switch to HTTPS configuration.

## Step 7: Verify Production Deployment

### 7.1 Test HTTPS

```bash
# Test from server
curl https://yourdomain.com/health

# Test from browser
# Visit: https://yourdomain.com
```

### 7.2 Check SSL Certificate

```bash
# Check certificate details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## Step 8: Set Up Automatic Updates (Optional)

### 8.1 Create Update Script

```bash
nano /opt/lubwe/update.sh
```

Add:

```bash
#!/bin/bash
cd /opt/lubwe

# Pull latest code
git pull  # if using git

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Clean up old images
docker image prune -f
```

Make executable:

```bash
chmod +x /opt/lubwe/update.sh
```

### 8.2 Set Up Cron for Automatic Certificate Renewal

Certbot runs automatically, but you can verify:

```bash
# Check certbot logs
docker-compose logs certbot | grep renew
```

## Step 9: Monitoring and Maintenance

### 9.1 View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100 api
```

### 9.2 Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### 9.3 Backup Database

```bash
# Create backup script
nano /opt/lubwe/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/opt/lubwe/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T db pg_dump -U postgres SchoolDB > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make executable and add to cron:

```bash
chmod +x /opt/lubwe/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/lubwe/backup-db.sh
```

## Step 10: Troubleshooting

### Common Issues

#### Containers won't start

```bash
# Check logs
docker-compose logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|5432)'

# Restart Docker
sudo systemctl restart docker
```

#### SSL certificate not working

```bash
# Check nginx logs
docker-compose logs nginx

# Verify certificate exists
docker-compose exec nginx ls -la /etc/letsencrypt/live/

# Manually request certificate
docker-compose exec certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com
```

#### Database connection issues

```bash
# Check database logs
docker-compose logs db

# Test connection
docker-compose exec db psql -U postgres -d SchoolDB

# Check environment variables
docker-compose exec api env | grep ConnectionStrings
```

#### API not responding

```bash
# Check API logs
docker-compose logs api

# Test API directly
docker-compose exec api curl http://localhost:8080/health

# Check if API container is healthy
docker-compose ps api
```

## Quick Reference Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart api

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Check service status
docker-compose ps

# Access database
docker-compose exec db psql -U postgres -d SchoolDB

# Access API container
docker-compose exec api sh

# Clean up unused images
docker image prune -a
```

## Security Checklist

- [ ] Strong PostgreSQL password set
- [ ] Strong JWT key generated (32+ characters)
- [ ] `.env` file has proper permissions (600)
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] SSL certificates working
- [ ] Regular backups configured
- [ ] Docker and system packages updated
- [ ] SSH key authentication enabled (disable password auth)

## Next Steps

1. Set up monitoring (e.g., Prometheus, Grafana)
2. Configure reverse proxy for additional services
3. Set up automated backups
4. Configure log rotation
5. Set up email notifications for errors

## Support

If you encounter issues, check:
- `docker-compose logs` for error messages
- `/opt/lubwe/TROUBLESHOOTING.md` for common solutions
- Verify all environment variables are set correctly
- Ensure domain DNS is properly configured

