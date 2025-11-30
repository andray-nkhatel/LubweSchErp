# GitHub Setup Guide

This guide will help you push your School ERP SMS project to GitHub.

## Prerequisites

- GitHub account
- Git installed on your machine
- SSH key set up with GitHub (recommended) or HTTPS access

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `school-erp-sms` (or your preferred name)
   - **Description**: "School ERP SMS - ASP.NET Core API with Vue 3 Client"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Initialize Git Repository (If Not Already Done)

```bash
cd /home/andrea/Documents/Sources/Lubwe

# Check if already a git repo
git status

# If not, initialize
git init
```

## Step 3: Verify .gitignore

Make sure `.gitignore` exists and includes sensitive files:

```bash
# Check .gitignore
cat .gitignore | grep -E "(\.env|node_modules|dist|bin|obj)"

# Verify .env is NOT tracked
git check-ignore .env
# Should output: .env
```

## Step 4: Add Files to Git

```bash
# Add all files (respecting .gitignore)
git add .

# Check what will be committed (verify no sensitive files)
git status

# Review the files that will be committed
git status --short
```

**Important:** Verify that `.env` files are NOT in the list!

## Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: School ERP SMS with Docker setup

- ASP.NET Core Web API
- Vue 3 client application
- Docker Compose configuration
- NGINX reverse proxy with SSL support
- PostgreSQL database
- Complete deployment documentation"
```

## Step 6: Add GitHub Remote

### Option A: Using SSH (Recommended)

```bash
# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# Verify remote
git remote -v
```

### Option B: Using HTTPS

```bash
# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Verify remote
git remote -v
```

## Step 7: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

If using HTTPS, you'll be prompted for credentials:
- Username: Your GitHub username
- Password: Use a Personal Access Token (not your GitHub password)

### Creating a Personal Access Token (for HTTPS)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name and select scopes: `repo`
4. Copy the token and use it as your password when pushing

## Step 8: Verify Upload

1. Go to your GitHub repository page
2. Verify all files are there
3. **IMPORTANT:** Check that `.env` files are NOT visible
4. Verify sensitive files like `node_modules`, `dist`, `bin`, `obj` are excluded

## Step 9: Create .env.example (Optional but Recommended)

Create a template for environment variables:

```bash
cat > .env.example << 'EOF'
# Database Configuration
POSTGRES_DB=SchoolDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_KEY=your_jwt_secret_key_here_minimum_32_characters
JWT_ISSUER=SUBLIME SCHOOL ERP
JWT_AUDIENCE=SUBLIME SCHOOL ERP

# Domain Configuration
DOMAIN=yourdomain.com
EMAIL=your-email@example.com

# API Configuration
ASPNETCORE_ENVIRONMENT=Production
EOF

# Add and commit
git add .env.example
git commit -m "Add .env.example template"
git push
```

## Step 10: Create README.md (If Not Exists)

```bash
cat > README.md << 'EOF'
# School ERP SMS

A comprehensive School ERP (Enterprise Resource Planning) and SMS (School Management System) built with ASP.NET Core and Vue 3.

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

See [QUICK_START.md](QUICK_START.md) for local development setup.

## Deployment

See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for production deployment instructions.

## Documentation

- [DOCKER_SETUP_SUMMARY.md](DOCKER_SETUP_SUMMARY.md) - Docker setup overview
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Detailed deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

## License

[Your License Here]
EOF

# Add and commit
git add README.md
git commit -m "Add README.md"
git push
```

## Common Git Commands

### Daily Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push

# Pull latest changes
git pull
```

### Working with Branches

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Merge branch
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature
```

### Excluding Files Already Tracked

If you accidentally committed sensitive files:

```bash
# Remove from git (but keep file locally)
git rm --cached .env

# Add to .gitignore (if not already)
echo ".env" >> .gitignore

# Commit the removal
git add .gitignore
git commit -m "Remove .env from tracking"
git push
```

## Security Checklist

Before pushing, verify:

- [ ] `.env` file is in `.gitignore` and NOT committed
- [ ] No passwords or API keys in code
- [ ] No database credentials in code
- [ ] No JWT secrets in code
- [ ] `node_modules/` is excluded
- [ ] `dist/` and build artifacts are excluded
- [ ] Log files are excluded
- [ ] Docker volumes are excluded

## Troubleshooting

### "Permission denied (publickey)"

Set up SSH keys:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
```

### "Large file" errors

If you have large files:
```bash
# Check for large files
find . -type f -size +50M -not -path "./.git/*"

# Use Git LFS for large files
git lfs install
git lfs track "*.pdf"
git lfs track "SchoolERPSMS/Media/**"
git add .gitattributes
```

### "Remote origin already exists"

```bash
# Check existing remotes
git remote -v

# Remove and re-add
git remote remove origin
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

## Next Steps

1. Set up branch protection rules on GitHub
2. Add collaborators if working in a team
3. Set up GitHub Actions for CI/CD (optional)
4. Create issues and project boards for task management
5. Add a LICENSE file

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Help](https://help.github.com)
- [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

