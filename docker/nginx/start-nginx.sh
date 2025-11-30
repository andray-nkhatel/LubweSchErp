#!/bin/sh
# Nginx startup script with SSL certificate detection and domain replacement

# API and client are guaranteed to be healthy due to depends_on
echo '[DEBUG] Starting nginx (dependencies are ready)...'

if [ ! -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ]; then
  echo 'SSL certificate not found, using HTTP template'
  cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf
  sed -i 's|api_backend|api:8080|g; s|client_frontend|client:80|g' /etc/nginx/conf.d/default.conf
else
  echo 'SSL certificate found, using HTTPS configuration'
  DOMAIN_VAL=${DOMAIN}
  echo "[DEBUG] DOMAIN_VAL is set to: [$DOMAIN_VAL]"
  if [ -z "$DOMAIN_VAL" ] || [ "$DOMAIN_VAL" = "localhost" ] || [ "$DOMAIN_VAL" = "" ]; then
    echo 'ERROR: DOMAIN environment variable is not set or is invalid!'
    echo 'Falling back to HTTP configuration...'
    cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf
    sed -i 's|api_backend|api:8080|g; s|client_frontend|client:80|g' /etc/nginx/conf.d/default.conf
  else
    echo "[DEBUG] Copying HTTPS config and replacing domain: $DOMAIN_VAL" >&2
    cp /etc/nginx/nginx-https.conf /etc/nginx/conf.d/default.conf
    # Use # as delimiter to avoid issues with domain containing special chars
    sed -i "s#REPLACE_WITH_DOMAIN#$DOMAIN_VAL#g" /etc/nginx/conf.d/default.conf
    echo "[DEBUG] Replacement complete. Verifying..." >&2
    # Verify replacement worked
    if grep -q "REPLACE_WITH_DOMAIN" /etc/nginx/conf.d/default.conf; then
      echo "[ERROR] Replacement failed! REPLACE_WITH_DOMAIN still found in config" >&2
      echo "[DEBUG] Showing lines with REPLACE_WITH_DOMAIN:" >&2
      grep -n "REPLACE_WITH_DOMAIN" /etc/nginx/conf.d/default.conf >&2
      exit 1
    fi
    echo "[DEBUG] Replacement successful. Showing key config lines:" >&2
    grep -E "server_name|ssl_certificate" /etc/nginx/conf.d/default.conf | head -3 >&2
    # Also check for any variable-like syntax that might cause issues
    if grep -E '\$\{[^}]*domain|\$domain' /etc/nginx/conf.d/default.conf; then
      echo "[ERROR] Found variable-like syntax in config that might cause issues!" >&2
      grep -n -E '\$\{[^}]*domain|\$domain' /etc/nginx/conf.d/default.conf >&2
    fi
  fi
fi

echo '[DEBUG] Testing nginx configuration...' >&2
nginx -t 2>&1 | tee /dev/stderr
if [ $? -eq 0 ]; then
  echo '[DEBUG] Nginx config test passed' >&2
  nginx -g 'daemon off;'
else
  echo '[ERROR] Nginx config test failed!' >&2
  echo '[DEBUG] Showing config file (first 50 lines):' >&2
  head -50 /etc/nginx/conf.d/default.conf >&2
  exit 1
fi

