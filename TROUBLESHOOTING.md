# Troubleshooting Guide

## Common Issues and Solutions

### NGINX Container Failing

**Symptoms:**
- `cp: can't create '/etc/nginx/conf.d/default.conf': File exists`
- `sed: can't move ... Resource busy`
- NGINX container exits with code 1

**Solution:**
The issue was that nginx.conf was mounted as read-only. This has been fixed by:
1. Using a Docker volume for nginx configuration instead of a bind mount
2. The configuration is now copied from the template at startup

**Fix Applied:**
- Changed from bind mount to Docker volume for nginx configuration
- Updated startup command to handle file copying properly

**To apply the fix:**
```bash
docker-compose down
docker-compose up -d --build
```

### Database Migration Issues

**Symptoms:**
- `relation "Users" does not exist`
- `relation "__EFMigrationsHistory" does not exist`
- Database seeder fails because tables don't exist

**Solution:**
The database initializer has been updated to:
1. Always attempt to apply migrations
2. Handle the case where the migrations table doesn't exist
3. Create the migrations table if needed

**If migrations still fail:**

1. **Check if migrations exist:**
   ```bash
   docker-compose exec api ls -la /app/Migrations
   ```

2. **Manually apply migrations:**
   ```bash
   docker-compose exec api dotnet ef database update
   ```

3. **If no migrations exist, create them:**
   ```bash
   # On your local machine (not in container)
   cd SchoolERPSMS
   dotnet ef migrations add InitialCreate
   ```

4. **Reset database (WARNING: deletes all data):**
   ```bash
   docker-compose down -v  # Removes volumes
   docker-compose up -d
   ```

### Docker Compose Version Warning

**Symptoms:**
- `WARN[0000] ... the attribute 'version' is obsolete`

**Solution:**
The `version: '3.8'` line has been removed from docker-compose.yml. This is no longer needed in modern Docker Compose.

### Port Already in Use

**Symptoms:**
- `Error: bind: address already in use`
- Services fail to start

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # or httpd, nginx, etc.

# Or change ports in docker-compose.yml
```

### Database Connection Issues

**Symptoms:**
- `could not connect to server`
- `Connection refused`

**Solution:**
1. **Check database is running:**
   ```bash
   docker-compose ps db
   ```

2. **Check database logs:**
   ```bash
   docker-compose logs db
   ```

3. **Verify connection string in .env:**
   ```env
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=SchoolDB
   POSTGRES_USER=postgres
   ```

4. **Test connection:**
   ```bash
   docker-compose exec db psql -U postgres -d SchoolDB
   ```

### API Not Starting

**Symptoms:**
- API container keeps restarting
- Health check fails

**Solution:**
1. **Check API logs:**
   ```bash
   docker-compose logs api
   ```

2. **Check environment variables:**
   ```bash
   docker-compose exec api env | grep -E "ASPNETCORE|ConnectionStrings|Jwt"
   ```

3. **Verify JWT key is set:**
   ```bash
   # In .env file
   JWT_KEY=your_32_character_minimum_key
   ```

4. **Check if API is listening:**
   ```bash
   docker-compose exec api wget -O- http://localhost:8080/health
   ```

### Client Build Fails

**Symptoms:**
- Client container fails during build
- `npm install` errors

**Solution:**
1. **Clear build cache:**
   ```bash
   docker-compose build --no-cache client
   ```

2. **Check package.json:**
   ```bash
   cat SchoolERPSMSClient/package.json
   ```

3. **Build manually to see errors:**
   ```bash
   cd SchoolERPSMSClient
   npm install
   npm run build
   ```

### DNS Issues

**Symptoms:**
- Domain shows parking page instead of application
- `Host not found` errors
- DNS resolution timeout

**Solution:**

1. **Configure DNS in your domain registrar (e.g., Porkbun):**
   - Add A record: `@` → Your VPS IP
   - Optional: Add `www` → Your VPS IP
   - Wait 15-30 minutes for propagation

2. **Fix DNS resolution on VPS:**
   ```bash
   # Use public DNS servers
   echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
   echo "nameserver 8.8.4.4" | sudo tee -a /etc/resolv.conf
   ```

3. **Verify DNS:**
   ```bash
   host yourdomain.com
   # Should show your VPS IP
   ```

### SSL Certificate Issues

**Symptoms:**
- Certbot fails to obtain certificate
- `Failed to obtain certificate`
- Certificate exists but HTTPS doesn't work

**Solution:**

1. **Verify DNS is working:**
   ```bash
   host yourdomain.com
   # Should show your VPS IP
   ```

2. **Check port 80 is accessible:**
   ```bash
   sudo ufw status | grep 80
   # Should show: 80/tcp ALLOW
   ```

3. **Request certificate manually:**
   ```bash
   docker-compose exec certbot certbot certonly --webroot \
       --webroot-path=/var/www/certbot \
       --email your-email@example.com \
       --agree-tos \
       --no-eff-email \
       -d yourdomain.com
   ```

4. **If webroot fails, use standalone:**
   ```bash
   docker-compose stop nginx
   docker-compose run --rm --service-ports certbot certbot certonly --standalone \
       --email your-email@example.com \
       --agree-tos \
       --no-eff-email \
       -d yourdomain.com
   docker-compose start nginx
   ```

5. **After certificate is obtained:**
   ```bash
   docker-compose restart nginx
   ```

### HTTPS Not Working

**Symptoms:**
- `Failed to connect to server port 443`
- Certificate exists but HTTPS fails
- nginx not listening on port 443

**Solution:**

1. **Check port 443 is open:**
   ```bash
   sudo ufw allow 443/tcp
   sudo ufw status | grep 443
   ```

2. **Check cloud provider firewall:**
   - **DigitalOcean:** Networking → Firewalls → Add rule (TCP 443)
   - **AWS:** Security Groups → Add inbound rule (HTTPS 443)
   - **Azure:** Network Security Groups → Add rule (Port 443)

3. **Verify nginx is listening:**
   ```bash
   docker-compose exec nginx ss -tulpn | grep 443
   # Should show nginx listening
   ```

4. **Check nginx configuration:**
   ```bash
   docker-compose exec nginx cat /etc/nginx/conf.d/default.conf | grep -A 3 "listen 443"
   # Should show HTTPS server block
   ```

5. **Test from inside container:**
   ```bash
   docker-compose exec nginx curl -I https://localhost
   # If this works, it's a firewall issue
   ```

### nginx Not Running or Stopping

**Symptoms:**
- `service "nginx" is not running`
- nginx container exits immediately
- Configuration errors

**Solution:**

1. **Check logs:**
   ```bash
   docker-compose logs nginx | tail -50
   docker-compose logs nginx | grep -i error
   ```

2. **Test nginx configuration:**
   ```bash
   docker-compose run --rm nginx nginx -t
   ```

3. **Check certificate files:**
   ```bash
   docker-compose exec nginx ls -la /etc/letsencrypt/live/yourdomain.com/
   ```

4. **Restart nginx:**
   ```bash
   docker-compose restart nginx
   # Or full restart
   docker-compose down
   docker-compose up -d
   ```

5. **Verify domain replacement in config:**
   ```bash
   docker-compose exec nginx cat /etc/nginx/conf.d/default.conf | grep server_name
   # Should show your domain, not REPLACE_WITH_DOMAIN
   ```

### CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- API requests fail

**Solution:**
1. **Verify Vue client uses relative path:**
   - Check that `VITE_API_BASE_URL=/api` in build
   - Check `api.service.js` uses relative paths

2. **Check NGINX proxy configuration:**
   ```bash
   docker-compose exec nginx cat /etc/nginx/conf.d/default.conf
   ```

3. **Verify API CORS configuration:**
   - Check `Program.cs` has CORS enabled
   - Verify `AllowAll` policy is active

### Container Health Check Failing

**Symptoms:**
- Containers show as "unhealthy"
- Health checks timeout

**Solution:**
1. **Check health check endpoint:**
   ```bash
   docker-compose exec api wget -O- http://localhost:8080/health
   ```

2. **Increase health check timeout:**
   ```yaml
   healthcheck:
     interval: 30s
     timeout: 10s
     retries: 5
     start_period: 60s  # Give more time for startup
   ```

3. **Disable health checks temporarily:**
   - Comment out healthcheck sections in docker-compose.yml

### Volume Permission Issues

**Symptoms:**
- `Permission denied` errors
- Files not accessible

**Solution:**
1. **Fix permissions:**
   ```bash
   sudo chown -R $USER:$USER ./SchoolERPSMS/Media
   sudo chown -R $USER:$USER ./logs
   ```

2. **Check volume mounts:**
   ```bash
   docker-compose exec api ls -la /app/Media
   ```

### Database Data Not Persisting

**Symptoms:**
- Data lost after container restart
- Database resets

**Solution:**
1. **Verify volume exists:**
   ```bash
   docker volume ls | grep db_data
   ```

2. **Check volume mount:**
   ```bash
   docker-compose exec db ls -la /var/lib/postgresql/data
   ```

3. **Backup before removing:**
   ```bash
   docker-compose exec db pg_dump -U postgres SchoolDB > backup.sql
   ```

## Getting Help

1. **Check all logs:**
   ```bash
   docker-compose logs --tail=100
   ```

2. **Check container status:**
   ```bash
   docker-compose ps
   ```

3. **Inspect container:**
   ```bash
   docker inspect school_api
   ```

4. **Check Docker system:**
   ```bash
   docker system df
   docker system prune  # Clean up (careful!)
   ```

## Reset Everything

If all else fails, reset everything:

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean Docker system
docker system prune -a --volumes

# Start fresh
docker-compose up -d --build
```

**WARNING:** This will delete all data including the database!

