#!/bin/bash
# Update script for Hotker Prompt Studio Docker deployment

set -e

echo "🔄 Updating Hotker Prompt Studio..."

# Pull latest code (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull
fi

# Rebuild and restart with new image
echo "🔨 Rebuilding Docker image..."
docker-compose build --no-cache

echo "🚀 Restarting container with new image..."
docker-compose up -d

echo "✅ Update complete!"
echo "📊 Container status:"
docker-compose ps
