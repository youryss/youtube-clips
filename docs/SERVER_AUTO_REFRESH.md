# 🖥️ Auto-Refresh no Servidor - Guia Completo

## ⚠️ Limitação do Playwright no Servidor

Playwright em modo headless dentro de Docker pode ter problemas com:
- Login automático (2FA, captcha)
- Detecção de bot do YouTube
- Falta de display virtual

## ✅ Solução Implementada

Criamos uma solução que:
1. **Tenta** regenerar cookies no servidor usando Playwright headless
2. Se falhar, você pode regenerar localmente e fazer upload

## 📦 Arquivos Criados

1. **`Dockerfile.cookie-refresh`** - Container com Playwright
2. **`src/auto_refresh_cookies_server.py`** - Script de refresh no servidor
3. **`refresh_cookies_server.sh`** - Script que executa refresh no servidor
4. **`setup_server_cron.sh`** - Configura cron job no servidor
5. **`install_server_refresh.sh`** - Instalação completa (recomendado)

## 🚀 Instalação Rápida

```bash
# Executar tudo de uma vez
./scripts/install_server_refresh.sh
```

Este script:
- ✅ Faz upload de todos os arquivos necessários
- ✅ Build do container cookie-refresh
- ✅ Configura cron job (a cada 6 horas)
- ✅ Torna scripts executáveis

## 📋 Como Funciona

### Cron Job no Servidor

```bash
# Executa a cada 6 horas
0 */6 * * * cd ~/youtube-viral-clipper && bash refresh_cookies_server.sh
```

### O que o script faz:

1. Build do container `cookie-refresh` (se necessário)
2. Executa `auto_refresh_cookies_server.py` dentro do container
3. Tenta gerar cookies usando Playwright headless
4. Salva em `cookies.txt`
5. Reinicia o backend

## 🔍 Verificar Status

### Ver cron jobs no servidor:
```bash
ssh root@164.90.193.41 'crontab -l'
```

### Ver logs:
```bash
ssh root@164.90.193.41 'tail -f /var/log/cookie-refresh.log'
```

### Testar manualmente:
```bash
./scripts/refresh_cookies_server.sh
```

## ⚠️ Se Falhar

Se o Playwright não conseguir fazer login automaticamente:

1. **Regenerar localmente**:
   ```bash
   python3 src/generate_cookies.py --email youtubioviral@gmail.com --output cookies.txt
   ```

2. **Upload para servidor**:
   ```bash
   ./scripts/upload_cookies.sh
   ```

## 🔧 Configuração Avançada

### Alterar frequência do cron:

```bash
# Editar no servidor
ssh root@164.90.193.41 'crontab -e'

# Mudar de "0 */6 * * *" para:
# - A cada 4 horas: "0 */4 * * *"
# - A cada 12 horas: "0 */12 * * *"
# - Diariamente às 3h: "0 3 * * *"
```

### Adicionar email no .env:

```bash
# No servidor, editar .env
COOKIE_EMAIL=youtubioviral@gmail.com
```

## 📊 Monitoramento

### Verificar se cookies estão válidos:
```bash
ssh root@164.90.193.41 'docker-compose exec backend python3 /app/src/check_cookies_server.py'
```

### Ver últimos logs do refresh:
```bash
ssh root@164.90.193.41 'tail -50 /var/log/cookie-refresh.log'
```

## ✅ Status

Após executar `./scripts/install_server_refresh.sh`:
- ✅ Container cookie-refresh criado
- ✅ Cron job configurado
- ✅ Auto-refresh ativo no servidor

O servidor tentará regenerar cookies automaticamente a cada 6 horas!

