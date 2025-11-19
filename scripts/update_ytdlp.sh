#!/bin/bash
# Script to update yt-dlp on the server

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

echo "🔍 Checking current yt-dlp version..."
echo ""

if command -v expect &> /dev/null; then
    TEMP_EXPECT=$(mktemp /tmp/check_version_XXXXXX.exp)
    cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 60
spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    "# " {
        send "cd $SERVER_PATH && docker-compose exec -T backend python3 -c 'import yt_dlp; print(\"Current version:\", yt_dlp.__version__)'\r"
        expect "# "
        send "docker-compose exec -T backend pip install --upgrade yt-dlp\r"
        expect "# "
        send "docker-compose exec -T backend python3 -c 'import yt_dlp; print(\"New version:\", yt_dlp.__version__)'\r"
        expect "# "
        send "docker-compose restart backend\r"
        expect "# "
        send "exit\r"
    }
    eof
}
EXPECT_EOF
    chmod +x "$TEMP_EXPECT"
    expect -f "$TEMP_EXPECT"
    rm -f "$TEMP_EXPECT"
else
    echo "expect not found. Please install it or use SSH key."
    exit 1
fi

echo ""
echo "✅ yt-dlp update completed!"

