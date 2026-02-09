# School ERP SMS

A comprehensive School ERP (Enterprise Resource Planning) and SMS (School Management System) built with ASP.NET Core and Vue 3.

## Quick Links

- **[QUICK_START.md](QUICK_START.md)** - Get started locally with Docker
- **[VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md)** - Deploy to production VPS
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[GITHUB_SETUP.md](GITHUB_SETUP.md)** - Push code to GitHub

## Features

- Student Management
- Teacher Management
- Grade Management
- Exam Score Entry
- Report Card Generation
- Academic Year Management
- And more...

## Tech Stack

- **Backend**: ASP.NET Core 9.0
- **Frontend**: Vue 3 + Vite
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: NGINX with SSL

## Quick Start

```bash
# Clone repository
git clone git@github.com:andray-nkhatel/LubweSchErp.git
cd LubweSchErp

# Create .env file
cp .env.example .env  # Edit with your values

# Start services
docker-compose up -d --build

# Access application
# http://localhost
```

See [QUICK_START.md](QUICK_START.md) for detailed local setup.

## Deployment

See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for production deployment instructions.

### Frontend: production-only image (no build on the server)

To avoid running the long `npm install` + `vite build` on a weak VPS, you can build the frontend once (locally or in CI) and then only serve the static files with nginx:

1. **Build the frontend** (API URL is in `SchoolERPSMSClient/.env.production` — currently `http://104.248.222.220:8080/api`):
   ```bash
   cd SchoolERPSMSClient
   npm ci
   npm run build
   ```
2. **From repo root**, build and run the production image (copies only `dist`, no Node on the server):
   ```bash
   docker compose -f docker-compose.frontend.production.yml up -d --build
   ```

See `docker/client/Dockerfile.production` and `docker-compose.frontend.production.yml` for details.

## Documentation

- [QUICK_START.md](QUICK_START.md) - Local development setup
- [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) - Production deployment guide
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Detailed Docker setup
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and fixes
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub repository setup

## License

[Your License Here]

