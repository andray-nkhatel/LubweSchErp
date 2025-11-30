#!/bin/bash
# Quick Git Setup Script for School ERP SMS
# Run this script to initialize git and prepare for GitHub push

set -e

echo "🚀 Setting up Git repository for School ERP SMS"
echo ""

# Check if already a git repo
if [ -d .git ]; then
    echo "⚠️  Git repository already initialized"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "📦 Initializing Git repository..."
    git init
fi

# Check if .gitignore exists
if [ ! -f .gitignore ]; then
    echo "❌ .gitignore not found! Please create it first."
    exit 1
fi

# Verify .env is ignored
if git check-ignore .env > /dev/null 2>&1; then
    echo "✅ .env is properly ignored"
else
    echo "⚠️  WARNING: .env is NOT ignored! Make sure it's in .gitignore"
fi

# Check for .env files
if [ -f .env ]; then
    echo "⚠️  WARNING: .env file exists. Make sure it's in .gitignore!"
    echo "   Current .env will NOT be committed (this is good)"
fi

echo ""
echo "📝 Adding files to Git..."
git add .

echo ""
echo "📊 Files to be committed:"
git status --short | head -20

echo ""
read -p "Review the files above. Continue with commit? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. Run 'git reset' if you want to unstage files."
    exit 1
fi

# Create initial commit
echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: School ERP SMS with Docker setup

- ASP.NET Core Web API
- Vue 3 client application  
- Docker Compose configuration
- NGINX reverse proxy with SSL support
- PostgreSQL database
- Complete deployment documentation"

echo ""
echo "✅ Git repository initialized and initial commit created!"
echo ""
echo "📋 Next steps:"
echo "1. Create a repository on GitHub"
echo "2. Add remote: git remote add origin git@github.com:USERNAME/REPO.git"
echo "3. Push: git branch -M main && git push -u origin main"
echo ""
echo "For detailed instructions, see GITHUB_SETUP.md"

