#!/bin/bash
# Complete setup for auto-refresh on server
# This installs everything needed on the server

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"
SERVER_PATH="~/youtube-viral-clipper"
EMAIL="youtubioviral@gmail.com"

echo "=========================================="
echo "🚀 Instalando auto-refresh no servidor..."
echo "=========================================="
echo ""

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: expect not found. Please install it: brew install expect"
    exit 1
fi

# First, upload all necessary files
echo "📤 Step 1: Uploading files..."
./scripts/upload_server_files.sh

echo ""
echo "📦 Step 2: Installing on server..."

TEMP_EXPECT=$(mktemp /tmp/install_server_XXXXXX.exp)
cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 300
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
        send "cd $SERVER_PATH\r"
        expect "# "
        
        # Make scripts executable
        send "chmod +x refresh_cookies_server.sh 2>/dev/null\r"
        expect "# "
        
        # Build cookie refresh container
        send "echo 'Building cookie refresh container...'\r"
        expect "# "
        send "docker-compose build cookie-refresh 2>&1 | tail -5\r"
        expect "# "
        
        # Remove old cron job
        send "crontab -l 2>/dev/null | grep -v 'refresh_cookies_server' | crontab -\r"
        expect "# "
        
        # Add cron job (every 6 hours)
        send "(crontab -l 2>/dev/null; echo '# Auto-refresh YouTube cookies every 6 hours'; echo '0 */6 * * * cd $SERVER_PATH && bash refresh_cookies_server.sh >> /var/log/cookie-refresh.log 2>&1') | crontab -\r"
        expect "# "
        
        # Verify cron job
        send "echo 'Cron jobs:'\r"
        expect "# "
        send "crontab -l | grep refresh_cookies_server\r"
        expect "# "
        
        send "echo 'Installation complete!'\r"
        expect "# "
        send "exit\r"
    }
    eof
}
EXPECT_EOF

chmod +x "$TEMP_EXPECT"
export SERVER_PASS="$SERVER_PASS"
expect -f "$TEMP_EXPECT"
RESULT=$?
rm -f "$TEMP_EXPECT"

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Instalação completa no servidor!"
    echo "=========================================="
    echo ""
    echo "O servidor irá tentar regenerar cookies a cada 6 horas."
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - Playwright em headless mode pode não conseguir fazer login automático"
    echo "   - Se falhar, você precisará regenerar cookies localmente"
    echo ""
    echo "Para verificar logs:"
    echo "  ssh $SERVER_USER@$SERVER_IP 'tail -f /var/log/cookie-refresh.log'"
    echo ""
    echo "Para testar agora:"
    echo "  ./scripts/refresh_cookies_server.sh"
else
    echo ""
    echo "❌ Erro na instalação"
    exit 1
fi

