#!/bin/bash

# Configuration
IMAGE_NAME="hotker/prompt-manager"
PLATFORM="linux/amd64"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

if [ -z "$VERSION" ]; then
  echo "Error: Could not get version from package.json"
  exit 1
fi

echo "🚀 Starting Docker Build & Publish Flow"
echo "📦 Image: $IMAGE_NAME"
echo "🏷️  Version: $VERSION"
echo "🏗️  Platform: $PLATFORM"

# Build and Push
# We use buildx if available for better multi-platform support, but standard build works if just forcing one platform
# checking for buildx
if docker buildx version > /dev/null 2>&1; then
    echo "✅ Docker Buildx detected, using it for multi-platform build (standardized)..."
    # Create a new builder instance if one doesn't exist (optional, often 'default' is fine but 'container' driver is better for multi-arch)
    # For single arch 'linux/amd64', standard build is usually fine, but let's use buildx to be safe with platform flag
    
    docker buildx build --platform $PLATFORM -t $IMAGE_NAME:latest -t $IMAGE_NAME:$VERSION --push .
else
    echo "⚠️  Docker Buildx not found, falling back to standard docker build..."
    # Build
    docker build --platform $PLATFORM -t $IMAGE_NAME:latest -t $IMAGE_NAME:$VERSION .
    
    # Push
    echo "⬆️  Pushing images to Docker Hub..."
    docker push $IMAGE_NAME:latest
    docker push $IMAGE_NAME:$VERSION
fi

echo "🎉 Done! Image published to Docker Hub."
