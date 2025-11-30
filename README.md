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

## Documentation

- [QUICK_START.md](QUICK_START.md) - Local development setup
- [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) - Production deployment guide
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Detailed Docker setup
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and fixes
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub repository setup

## License

[Your License Here]

