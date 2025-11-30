#!/bin/sh
# Nginx startup script that handles SSL certificates conditionally

echo "Checking for SSL certificates..."

# Check if SSL certificates exist
if [ -f /etc/nginx/ssl/domain.cert.pem ] && [ -f /etc/nginx/ssl/private.key.pem ]; then
    echo "SSL certificates found - using HTTPS configuration"
    # Copy the template (which has SSL config) to the conf.d directory
    cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf
    # Test the configuration
    nginx -t
    if [ $? -eq 0 ]; then
        echo "Nginx configuration test passed - starting with SSL"
        nginx -g 'daemon off;'
    else
        echo "ERROR: Nginx configuration test failed!"
        exit 1
    fi
else
    echo "SSL certificates not found - using HTTP-only configuration"
    # Create HTTP-only configuration
    cat > /etc/nginx/conf.d/default.conf << 'EOF'
# HTTP-only configuration (SSL certificates not found)

upstream api_backend {
    server api:8080;
    keepalive 32;
}

upstream client_frontend {
    server client:80;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    # API proxy
    location /api {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve Vue client
    location / {
        proxy_pass http://client_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    nginx -t
    if [ $? -eq 0 ]; then
        echo "Nginx configuration test passed - starting HTTP-only"
        nginx -g 'daemon off;'
    else
        echo "ERROR: Nginx configuration test failed!"
        exit 1
    fi
fi
