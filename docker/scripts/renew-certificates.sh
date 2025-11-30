#!/bin/bash

# Script to manually renew Let's Encrypt certificates
# This is also handled automatically by the certbot container

echo "Renewing SSL certificates..."

docker-compose run --rm certbot renew --webroot --webroot-path=/var/www/certbot

# Reload nginx to use new certificates
echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload

echo "Certificate renewal complete!"

