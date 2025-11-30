# Nginx Proxy Manager Setup Instructions:

1.  **Access the Nginx Proxy Manager UI:**
    *   After starting your `docker-compose.prod.yml` (which includes Nginx Proxy Manager), open your web browser and navigate to `http://your_vps_ip:81`.
    *   The default credentials are:
        *   Email: `admin@example.com`
        *   Password: `changeme`
    *   **Immediately change these credentials** upon first login for security reasons.

2.  **Add a Proxy Host for the Backend API:**
    *   In the Nginx Proxy Manager UI, go to `Hosts` -> `Proxy Hosts` -> `Add Proxy Host`.
    *   **Details Tab:**
        *   **Domain Names:** `api.yourdomain.com` (replace `yourdomain.com` with your actual domain).
        *   **Scheme:** `http`
        *   **Forward Hostname / IP:** `backend` (this is the service name of your backend in `docker-compose.prod.yml`).
        *   **Forward Port:** `80` (the default port for ASP.NET Core applications).
        *   **Cache Assets:** No.
        *   **Block Common Exploits:** Yes.
        *   **Websockets Support:** Yes (if your API uses WebSockets).
    *   **SSL Tab:**
        *   **SSL Certificate:** `Request a new SSL Certificate` (or use an existing one).
        *   **Force SSL:** Yes.
        *   **HTTP/2 Support:** Yes.
        *   **Email Address for Let's Encrypt:** Your email address for notifications.
        *   **I Agree to the Let's Encrypt Terms of Service:** Check this box.
    *   Click `Save`.

3.  **Add a Proxy Host for the Frontend Application:**
    *   In the Nginx Proxy Manager UI, go to `Hosts` -> `Proxy Hosts` -> `Add Proxy Host`.
    *   **Details Tab:**
        *   **Domain Names:** `yourdomain.com` (replace with your actual domain).
        *   **Scheme:** `http`
        *   **Forward Hostname / IP:** `frontend` (this is the service name of your frontend in `docker-compose.prod.yml`).
        *   **Forward Port:** `80` (the port Nginx is listening on inside your frontend container).
        *   **Cache Assets:** Yes (for better performance, as the frontend serves static assets).
        *   **Block Common Exploits:** Yes.
        *   **Websockets Support:** No (unless your frontend itself needs direct WebSocket connections to Nginx).
    *   **SSL Tab:**
        *   **SSL Certificate:** `Request a new SSL Certificate`.
        *   **Force SSL:** Yes.
        *   **HTTP/2 Support:** Yes.
        *   **Email Address for Let's Encrypt:** Your email address.
        *   **I Agree to the Let's Encrypt Terms of Service:** Check this box.
    *   Click `Save`.

**Domain and DNS Setup:**
*   You need to configure your domain's DNS records to point to your VPS's IP address.
    *   Create an `A` record for `yourdomain.com` pointing to `your_vps_ip`.
    *   Create an `A` record for `api.yourdomain.com` pointing to `your_vps_ip`.
    *   It may take some time for DNS changes to propagate.
