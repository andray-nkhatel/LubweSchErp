# Quick Deployment Checklist

## Pre-Deployment (On Your Local Machine)

1. **Prepare your code:**
   ```bash
   cd /home/andrea/Documents/Sources/Lubwe
   
   # Create .env file if you haven't already
   cp .env.example .env  # if exists, or create manually
   ```

2. **Generate secure passwords:**
   ```bash
   # Generate PostgreSQL password
   openssl rand -base64 32
   
   # Generate JWT key
   openssl rand -base64 32
   ```

3. **Prepare for transfer:**
   - Ensure `.env` is NOT in the transfer (it will be created on VPS)
   - Remove or exclude `node_modules`, `dist`, `.git` if not needed

## On Your VPS

### 1. Initial Setup (One-time)

```bash
# Connect to VPS
ssh root@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Transfer Code

**Option 1: Using Git (Recommended)**
```bash
cd /opt
sudo git clone <your-repo-url> lubwe
cd lubwe
```

**Option 2: Using SCP (from local machine)**
```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  /home/andrea/Documents/Sources/Lubwe/ root@your-vps-ip:/opt/lubwe/
```

### 3. Configure Environment

```bash
cd /opt/lubwe
nano .env
```

Add:
```env
POSTGRES_DB=SchoolDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<generated-password>
JWT_KEY=<generated-jwt-key>
JWT_ISSUER=SUBLIME SCHOOL ERP
JWT_AUDIENCE=SUBLIME SCHOOL ERP
DOMAIN=yourdomain.com
EMAIL=your-email@example.com
ASPNETCORE_ENVIRONMENT=Production
```

### 4. Deploy

```bash
# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Set Up SSL (After DNS is configured)

```bash
# Ensure domain points to VPS IP
# Then restart nginx - it will auto-detect certificates
docker-compose restart nginx

# Check certbot logs
docker-compose logs certbot
```

## Verify Deployment

```bash
# Test API
curl http://localhost/api/health

# Test from browser
# Visit: http://your-vps-ip or https://yourdomain.com
```

## Common Commands

```bash
# View logs
docker-compose logs -f

# Restart service
docker-compose restart api

# Rebuild after changes
docker-compose up -d --build client

# Stop everything
docker-compose down

# Start everything
docker-compose up -d
```

## Troubleshooting

```bash
# Check what's wrong
docker-compose logs

# Check container status
docker-compose ps

# Restart everything
docker-compose restart
```

For detailed instructions, see `VPS_DEPLOYMENT.md`

