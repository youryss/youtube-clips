#!/bin/bash
# Upload updated download.py and rebuild

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"

echo "Uploading updated src/download.py..."
scp src/download.py "$SERVER_USER@$SERVER_IP:$SERVER_PATH/src/download.py"

if [ $? -eq 0 ]; then
    echo "✓ File uploaded"
    echo ""
    echo "Now rebuilding on server..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker-compose build --no-cache backend && docker-compose up -d backend"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Done! Backend rebuilt and restarted."
    else
        echo "❌ Error rebuilding"
        exit 1
    fi
else
    echo "❌ Error uploading file"
    exit 1
fi

