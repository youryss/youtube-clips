#!/bin/bash
# Setup cron job directly on server

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"
SERVER_PATH="~/youtube-viral-clipper"
EMAIL="youtubioviral@gmail.com"

echo "=========================================="
echo "🔧 Configurando cron job no servidor..."
echo "=========================================="

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: expect not found. Please install it: brew install expect"
    exit 1
fi

TEMP_EXPECT=$(mktemp /tmp/setup_cron_XXXXXX.exp)
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
        send "cd $SERVER_PATH\r"
        expect "# "
        
        # Remove old cron job if exists
        send "crontab -l 2>/dev/null | grep -v 'refresh_cookies_server' | crontab -\r"
        expect "# "
        
        # Add new cron job (every 6 hours)
        send "(crontab -l 2>/dev/null; echo '0 */6 * * * cd $SERVER_PATH && bash refresh_cookies_server.sh >> /var/log/cookie-refresh.log 2>&1') | crontab -\r"
        expect "# "
        
        # Verify
        send "crontab -l | grep 'refresh_cookies_server'\r"
        expect "# "
        
        send "echo 'Cron job configured!'\r"
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
    echo "✅ Cron job configurado no servidor!"
    echo ""
    echo "O servidor irá regenerar cookies automaticamente a cada 6 horas."
    echo ""
    echo "Para verificar:"
    echo "  ssh $SERVER_USER@$SERVER_IP 'crontab -l'"
    echo ""
    echo "Para testar agora:"
    echo "  ./scripts/refresh_cookies_server.sh"
else
    echo ""
    echo "❌ Erro ao configurar cron job"
    exit 1
fi

