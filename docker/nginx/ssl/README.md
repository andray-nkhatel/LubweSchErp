# SSL Certificates Directory

Place your SSL certificate files from your domain registrar in this directory.

## Required Files

You need to place your SSL certificate files here with one of these naming conventions:

### Option 1 (Recommended):
- `certificate.crt` - Your SSL certificate file (or fullchain.pem)
- `private.key` - Your private key file

### Option 2:
- `fullchain.pem` - Your SSL certificate file
- `privkey.pem` - Your private key file

## Configuration

The nginx configuration (`nginx.conf`) is set to use:
- Certificate: `/etc/nginx/ssl/certificate.crt`
- Private Key: `/etc/nginx/ssl/private.key`

If your certificate files have different names, you can either:
1. Rename them to match the expected names, OR
2. Update the `ssl_certificate` and `ssl_certificate_key` paths in `docker/nginx/nginx.conf`

## File Permissions

Make sure your certificate files have appropriate permissions:
```bash
chmod 600 private.key
chmod 644 certificate.crt
```

## Security Note

This directory is already in `.gitignore` to prevent accidentally committing your private keys.

