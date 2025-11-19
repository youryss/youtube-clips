# ✅ Instalação no Servidor - Status

## 📤 Arquivos Enviados com Sucesso

Os seguintes arquivos foram enviados para o servidor:
- ✅ `Dockerfile.cookie-refresh` - Container com Playwright
- ✅ `src/auto_refresh_cookies_server.py` - Script de refresh
- ✅ `refresh_cookies_server.sh` - Script executor
- ✅ `docker-compose.yml` - Atualizado com serviço cookie-refresh

## 🔧 Completar Configuração Manualmente

Se o cron job não foi configurado automaticamente, execute no servidor:

### 1. Conectar ao servidor:
```bash
ssh root@164.90.193.41
```

### 2. Ir para o diretório:
```bash
cd ~/youtube-viral-clipper
```

### 3. Tornar script executável:
```bash
chmod +x refresh_cookies_server.sh
```

### 4. Build do container:
```bash
docker-compose build cookie-refresh
```

### 5. Configurar cron job:
```bash
# Adicionar ao crontab
(crontab -l 2>/dev/null; echo '0 */6 * * * cd ~/youtube-viral-clipper && bash refresh_cookies_server.sh >> /var/log/cookie-refresh.log 2>&1') | crontab -

# Verificar
crontab -l | grep refresh_cookies_server
```

## ✅ Verificar Instalação

### Verificar arquivos:
```bash
ssh root@164.90.193.41 'cd ~/youtube-viral-clipper && ls -la Dockerfile.cookie-refresh refresh_cookies_server.sh'
```

### Verificar cron job:
```bash
ssh root@164.90.193.41 'crontab -l | grep refresh_cookies_server'
```

### Testar manualmente:
```bash
ssh root@164.90.193.41 'cd ~/youtube-viral-clipper && bash refresh_cookies_server.sh'
```

## 📋 Como Funciona

1. **Cron job executa** a cada 6 horas
2. **Executa** `refresh_cookies_server.sh`
3. **Build** do container cookie-refresh (se necessário)
4. **Roda** Playwright headless para gerar cookies
5. **Salva** em `cookies.txt`
6. **Reinicia** o backend

## ⚠️ Limitações

- Playwright em headless pode não conseguir fazer login automático
- Se falhar, você precisará regenerar cookies localmente e fazer upload

## 🔍 Monitorar

### Ver logs:
```bash
ssh root@164.90.193.41 'tail -f /var/log/cookie-refresh.log'
```

### Verificar se funcionou:
```bash
ssh root@164.90.193.41 'docker-compose exec backend ls -lh /app/cookies.txt'
```

## 🎯 Próximos Passos

1. ✅ Arquivos enviados
2. ⏳ Completar configuração manual (se necessário)
3. ⏳ Testar refresh manual
4. ⏳ Monitorar logs

## 💡 Alternativa Rápida

Se quiser testar agora sem esperar o cron:

```bash
# No servidor
cd ~/youtube-viral-clipper
bash refresh_cookies_server.sh
```

