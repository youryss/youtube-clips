#!/bin/bash
# Script to upload updated Dockerfile with Node.js support and rebuild backend

SERVER_IP="${SERVER_IP:-164.90.193.41}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

echo "📦 Atualizando Dockerfile com Node.js e reconstruindo backend..."

if ! command -v expect &> /dev/null; then
    echo "❌ Erro: 'expect' não está instalado. Instale com: brew install expect"
    exit 1
fi

# Create temporary expect script
TEMP_EXPECT=$(mktemp /tmp/update_dockerfile_XXXXXX.exp)

cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 300
log_user 1

# Upload Dockerfile
spawn scp -o StrictHostKeyChecking=no Dockerfile $SERVER_USER@$SERVER_IP:~/youtube-viral-clipper/Dockerfile
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    eof
}

# Wait a bit
sleep 2

# SSH and rebuild
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
        send "cd ~/youtube-viral-clipper && echo '🔨 Reconstruindo backend com Node.js...' && docker-compose build --no-cache backend\r"
        expect {
            "# " {
                send "echo '✅ Build completo! Reiniciando backend...' && docker-compose restart backend\r"
                expect "# "
                send "echo '✅ Backend reiniciado com Node.js!' && docker-compose exec backend node --version\r"
                expect "# "
                send "exit\r"
            }
            timeout {
                send "\r"
                exp_continue
            }
        }
    }
    eof
}
EXPECT_EOF

chmod +x "$TEMP_EXPECT"
expect -f "$TEMP_EXPECT"
EXIT_CODE=$?
rm -f "$TEMP_EXPECT"

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Dockerfile atualizado e backend reconstruído com sucesso!"
    echo "📋 Node.js agora está disponível para resolver challenges do YouTube"
else
    echo ""
    echo "❌ Erro ao atualizar Dockerfile. Verifique a conexão e tente novamente."
    exit 1
fi

