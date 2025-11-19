# 🖥️ Guia de Configuração no Servidor

## ⚠️ Limitação Importante

**Playwright requer um navegador real**, o que é difícil de configurar em um container Docker no servidor. Por isso, temos **duas opções**:

## Opção 1: Auto-Refresh Local + Upload Automático (Recomendado)

Esta é a solução mais simples e confiável:

### Configurar no seu computador local:

```bash
# 1. Configurar cron job local (já feito)
crontab -l | grep auto_refresh_cookies

# 2. O cron job executa automaticamente:
# - Gera cookies localmente (com navegador real)
# - Faz upload para o servidor
# - Reinicia o backend
```

**Vantagens:**
- ✅ Funciona perfeitamente (navegador real)
- ✅ Não precisa configurar nada no servidor
- ✅ Automático

**Desvantagem:**
- ⚠️ Seu computador precisa estar ligado (ou usar um servidor sempre-on)

## Opção 2: Verificação no Servidor + Notificação

O servidor verifica se os cookies estão válidos e notifica quando precisam ser atualizados:

### Configurar no servidor:

```bash
# 1. Fazer upload dos arquivos
./scripts/upload_server_files.sh

# 2. Configurar cron job no servidor
./scripts/setup_server_cron.sh
```

O cron job no servidor:
- Verifica validade dos cookies a cada hora
- Se precisar refresh, você é notificado
- Você então executa o refresh localmente e faz upload

## Opção 3: Container com Playwright (Avançado)

Se você realmente quer que funcione no servidor:

### Requisitos:
1. Servidor com X11/display virtual
2. Container com Playwright instalado
3. Configuração complexa

### Passos:

```bash
# 1. Build do container
docker-compose build cookie-refresh

# 2. Testar
docker-compose run --rm cookie-refresh python3 auto_refresh_cookies_server.py --email youtubioviral@gmail.com

# 3. Configurar cron
./scripts/setup_server_cron.sh
```

**Problema**: Playwright em headless mode pode não conseguir fazer login automaticamente (2FA, captcha, etc.)

## 📋 Recomendação Final

**Use a Opção 1** (auto-refresh local):
- Mais confiável
- Mais simples
- Funciona sempre

Se seu computador não fica sempre ligado, considere:
- Usar um servidor sempre-on (Raspberry Pi, VPS pequeno)
- Ou usar a Opção 2 (verificação + notificação)

## 🔧 Scripts Disponíveis

1. **`setup_local_auto_refresh.sh`** - Configura no seu computador (já feito ✅)
2. **`setup_server_cron.sh`** - Configura verificação no servidor
3. **`refresh_cookies_server.sh`** - Executa refresh no servidor (requer Playwright)
4. **`upload_server_files.sh`** - Faz upload de arquivos para o servidor

## ✅ Status Atual

- ✅ Auto-refresh local configurado (cron job ativo)
- ⏳ Servidor: aguardando sua escolha de abordagem

