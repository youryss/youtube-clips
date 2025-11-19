#!/bin/bash
# Script to clean up Docker and check disk space on server

SERVER_IP="164.90.193.41"
SERVER_USER="root"

echo "=========================================="
echo "Checking disk space on server..."
echo "=========================================="

ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
echo "Disk usage:"
df -h

echo ""
echo "=========================================="
echo "Docker disk usage:"
echo "=========================================="
docker system df

echo ""
echo "=========================================="
echo "Cleaning up Docker..."
echo "=========================================="

# Remove unused containers, networks, images, and build cache
echo "Removing unused Docker resources..."
docker system prune -a -f --volumes

echo ""
echo "Removing old build cache..."
docker builder prune -a -f

echo ""
echo "=========================================="
echo "Disk usage after cleanup:"
echo "=========================================="
df -h

echo ""
echo "Docker disk usage after cleanup:"
docker system df
EOF

echo ""
echo "=========================================="
echo "✅ Cleanup complete!"
echo "=========================================="
echo ""
echo "Now try rebuilding:"
echo "  docker-compose build --no-cache backend"

