#!/bin/bash

# Script to initialize Let's Encrypt certificates
# Usage: ./init-letsencrypt.sh [domain] [email]
# If domain/email are not provided, they will be read from .env file

# Load .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Use command-line arguments if provided, otherwise use .env values
DOMAIN=${1:-$DOMAIN}
EMAIL=${2:-$EMAIL}

# Validate required variables
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Error: DOMAIN and EMAIL must be provided"
    echo "Usage: $0 [domain] [email]"
    echo "Or set DOMAIN and EMAIL in .env file"
    echo "Example: $0 example.com admin@example.com"
    exit 1
fi

echo "Setting up Let's Encrypt for domain: $DOMAIN"
echo "Email: $EMAIL"

# Create necessary directories
mkdir -p ./docker/nginx/certbot/www
mkdir -p ./docker/nginx/certbot/conf

# Update docker-compose.yml with domain (if using sed)
# Or set it in .env file

# Start nginx with template configuration
echo "Starting nginx with template configuration..."
docker-compose up -d nginx

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
sleep 5

# Request certificate
echo "Requesting SSL certificate from Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Check if certificate was obtained
if [ -f "./docker/nginx/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "Certificate obtained successfully!"
    echo "Updating nginx configuration..."
    
    # Update nginx.conf with domain
    sed -i "s/\${DOMAIN}/$DOMAIN/g" ./docker/nginx/nginx.conf
    
    # Restart nginx
    echo "Restarting nginx with SSL configuration..."
    docker-compose restart nginx
    
    echo "SSL setup complete! Your site should now be accessible at https://$DOMAIN"
else
    echo "Failed to obtain certificate. Please check the logs:"
    echo "docker-compose logs certbot"
    exit 1
fi

