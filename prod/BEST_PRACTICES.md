# Security and Performance Best Practices for VPS Deployment

## 1. VPS Security

*   **SSH Key Authentication:** Always disable password authentication for SSH. Use robust SSH key pairs for secure access.
*   **Firewall:** Configure your VPS firewall (e.g., `ufw` on Linux, security groups on cloud providers) to only allow incoming connections on necessary ports:
    *   `22` (SSH - restrict to specific IPs if possible)
    *   `80` (HTTP)
    *   `443` (HTTPS)
    *   `81` (Nginx Proxy Manager Admin UI - **temporarily** open, then restrict access or expose only via secure tunnel)
*   **Regular Updates:** Keep your VPS operating system and all installed packages updated to patch security vulnerabilities.
*   **Fail2Ban:** Install and configure Fail2Ban to protect against brute-force attacks on SSH and other services.

## 2. Docker Security

*   **Non-Root User:** Run your application containers with a non-root user. You can add `USER appuser` after creating a user in your `Dockerfile`.
*   **Minimize Image Size:** Use minimal base images (e.g., `alpine` versions) to reduce the attack surface and download times.
*   **Don't Expose Sensitive Ports:** Only expose ports that are absolutely necessary. Nginx Proxy Manager handles external exposure for your application services.
*   **Volume Permissions:** Ensure that host volumes mounted into containers have appropriate, restrictive permissions.
*   **Secret Management:** Avoid hardcoding secrets. Use Docker secrets or environment variables (loaded via `.env` file for Docker Compose) for sensitive information.

## 3. Application Security (Backend & Frontend)

*   **Input Validation:** Implement robust input validation on both frontend and backend to prevent common vulnerabilities like SQL injection, XSS, and CSRF.
*   **Parameterize Queries:** Always use parameterized queries for all database interactions to prevent SQL injection.
*   **Sanitize User Input:** Sanitize all user-generated content before rendering it on the frontend to prevent XSS attacks.
*   **Secure Authentication:** Use strong, salted, and hashed passwords. Implement proper session management, including secure cookies and token expiration.
*   **Rate Limiting:** Implement rate limiting on sensitive endpoints (e.g., login, registration, password reset) to prevent brute-force and denial-of-service attacks.
*   **Content Security Policy (CSP):** Implement a strict CSP on your frontend to mitigate XSS and data injection attacks.
*   **HTTP Security Headers:** Configure security-related HTTP headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`) via Nginx Proxy Manager or your backend.
*   **Error Handling:** Provide generic error messages to users. Log detailed errors internally, but never expose sensitive error information (stack traces, internal details) to the client.

## 4. Performance Optimization

*   **Frontend Caching:** Leverage browser caching for static assets. Nginx Proxy Manager can be configured to send appropriate caching headers. Your `prod/frontend/nginx.conf` already includes some caching for static assets.
*   **Backend Caching:** Implement caching for frequently accessed data in your .NET backend (e.g., using Redis, in-memory cache, or database-level caching).
*   **Database Indexing:** Ensure your database tables have appropriate indexes for frequently queried columns to speed up read operations.
*   **Optimize Database Queries:** Regularly profile and optimize slow database queries.
*   **Asset Minification/Compression:** Your Vue.js build process handles JavaScript and CSS minification. Nginx Proxy Manager (or Nginx itself) can be configured for Gzip/Brotli compression of static and dynamic content.
*   **Image Optimization:** Optimize all images for web use (compression, appropriate formats, responsive images).
*   **Resource Limits:** Configure resource limits (CPU, memory) for your Docker containers in `docker-compose.prod.yml` to prevent a single service from monopolizing VPS resources and to ensure stability.

    Example for `docker-compose.prod.yml`:
    ```yaml
    services:
      backend:
        deploy:
          resources:
            limits:
              memory: 512m
              cpus: '0.5' # 50% of one CPU core
    ```

## 5. Monitoring and Logging

*   **Centralized Logging:** Set up a centralized logging solution (e.g., ELK stack, Grafana Loki, or a cloud logging service) to collect and analyze logs from all your containers.
*   **Monitoring:** Use monitoring tools (e.g., Prometheus/Grafana, or cloud monitoring services) to track the health, performance, and resource usage of your services and the VPS.
*   **Alerting:** Configure alerts for critical issues (e.g., service downtime, high CPU/memory usage, error rates, disk space) to be notified proactively.
