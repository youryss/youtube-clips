#!/bin/bash
# Script para gerar cookies do YouTube e fazer upload para o servidor

echo "=========================================="
echo "🔐 Gerando cookies do YouTube..."
echo "=========================================="
echo ""
echo "📋 Instruções:"
echo "1. O navegador abrirá automaticamente"
echo "2. Faça login no YouTube (email: youtubioviral@gmail.com)"
echo "3. Complete 2FA se necessário"
echo "4. Aguarde até ver a página inicial do YouTube"
echo "5. Volte aqui e pressione Enter quando solicitado"
echo ""
echo "Pressione Enter para iniciar..."
read

# Gerar cookies
echo ""
echo "🚀 Iniciando geração de cookies..."
python3 src/generate_cookies.py --email youtubioviral@gmail.com --output cookies.txt

# Verificar se foi bem-sucedido
if [ $? -eq 0 ] && [ -f cookies.txt ]; then
    echo ""
    echo "✅ Cookies gerados com sucesso!"
    echo "📊 Tamanho do arquivo: $(ls -lh cookies.txt | awk '{print $5}')"
    echo ""
    echo "=========================================="
    echo "📤 Fazendo upload para o servidor..."
    echo "=========================================="
    
    # Fazer upload
    ./scripts/upload_cookies.sh
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo "✅ SUCESSO! Cookies gerados e enviados!"
        echo "=========================================="
        echo ""
        echo "O backend será reiniciado automaticamente."
        echo "Agora você pode testar com um novo vídeo na interface web."
    else
        echo ""
        echo "❌ Erro ao fazer upload. Verifique os logs acima."
        exit 1
    fi
else
    echo ""
    echo "❌ Erro ao gerar cookies. Verifique os logs acima."
    exit 1
fi

