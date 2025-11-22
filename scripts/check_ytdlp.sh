#!/bin/bash
# Quick script to check yt-dlp installation in Docker container

echo "🔍 Checking yt-dlp installation..."
echo ""

# Check if we're in the project directory
if [ ! -f "docker-compose.yml" ]; then
    echo "⚠️  Warning: docker-compose.yml not found in current directory"
    echo "   Please navigate to the project directory first:"
    echo "   cd ~/youtube-viral-clipper"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "=== Checking yt-dlp in Docker container ==="
docker-compose exec -T backend python3 -c "import yt_dlp; print('✅ yt-dlp version:', yt_dlp.__version__)" 2>&1

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ yt-dlp not found in container. Installing..."
    docker-compose exec -T backend pip install --upgrade 'yt-dlp[default]' 2>&1 | tail -10
    echo ""
    echo "=== Verifying installation ==="
    docker-compose exec -T backend python3 -c "import yt_dlp; print('✅ yt-dlp version:', yt_dlp.__version__)" 2>&1
fi

echo ""
echo "=== Checking related packages ==="
docker-compose exec -T backend pip list | grep -E "yt-dlp|ytdlp" || echo "No yt-dlp packages found"

echo ""
echo "=== Node.js version (required for JS runtime) ==="
docker-compose exec -T backend node --version 2>&1 || echo "⚠️  Node.js not found"

