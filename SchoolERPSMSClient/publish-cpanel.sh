#!/bin/bash

# === Configuration ===
PROJECT_NAME="Bluebird-Vue"    # <-- Replace with your project name
BUILD_DIR="dist"               # Default Vue build output directory
FTP_PASSWORD="9dForjNhtFJB"

# === FTP Settings ===
FTP_HOST="ftp.chudleighhouseschool.com"     # <-- Replace with actual FTP host
FTP_USER="sandbox@bluebird.chudleighhouseschool.com"      # <-- Replace with FTP username
FTP_PASS="${FTP_PASSWORD}"  # <-- Replace with FTP password
REMOTE_DIR="/home1/chudleighhouse/bluebird.chudleighhouseschool.com/sandbox"

echo "=========================================="
echo "Building and Publishing PrimeVue App"
echo "Project: $PROJECT_NAME"
echo "Build Directory: $BUILD_DIR"
echo "=========================================="

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed. Exiting."
        exit 1
    fi
fi

# Remove previous build folder
if [ -d "$BUILD_DIR" ]; then
    echo "Removing existing build folder..."
    rm -rf "$BUILD_DIR"
fi

# Build the Vue project
echo "Building Vue project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Exiting."
    exit 1
fi

echo "✅ Build complete!"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory '$BUILD_DIR' not found. Build may have failed."
    exit 1
fi

# Upload to FTP using lftp
echo "Uploading to hosting provider via FTP..."

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:ssl-allow no
set ftp:list-options -a
set net:reconnect-interval-base 5
set net:max-retries 3
set net:timeout 30
lcd $BUILD_DIR
cd $REMOTE_DIR
mirror -R --delete --no-perms --verbose ./ ./
bye
EOF

if [ $? -ne 0 ]; then
    echo "❌ FTP upload failed. Please check credentials and network."
    exit 1
fi

echo "✅ Upload complete! Your PrimeVue app should now be live."

# Optionally open the build folder in the file manager
if command -v xdg-open &> /dev/null; then
    xdg-open "$BUILD_DIR" 2>/dev/null
elif command -v open &> /dev/null; then
    open "$BUILD_DIR" 2>/dev/null
fi

echo "=========================================="
echo "Deployment Summary:"
echo "- Project: $PROJECT_NAME"
echo "- Build folder: $BUILD_DIR"
echo "- Remote directory: $REMOTE_DIR"
echo "- FTP Host: $FTP_HOST"
echo "=========================================="