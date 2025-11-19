# Guia de Implementação de Bypass

## 1. ✅ Melhorias Já Implementadas

### Rotação de User Agents
- O código agora rotaciona user agents aleatoriamente
- 5 diferentes user agents (Chrome, Firefox, Safari em diferentes OS)

### Mais Clientes YouTube
- iOS client
- Android client  
- Mweb client (mobile web) - **NOVO**
- Web client
- TV embedded client - **NOVO**

### Suporte a Proxy (Configurável)
- Adicione `YT_DLP_PROXY` no `.env`:
  ```bash
  YT_DLP_PROXY=http://proxy:port
  # ou
  YT_DLP_PROXY=socks5://proxy:port
  ```

## 2. 🔄 Auto-Refresh de Cookies

### Configurar Cron Job (Recomendado)

```bash
# Editar crontab
crontab -e

# Adicionar linha para refresh a cada 6 horas
0 */6 * * * cd /path/to/youtube-viral-clipper && python3 src/auto_refresh_cookies.py --email youtubioviral@gmail.com --upload
```

### Executar Manualmente

```bash
# Apenas refresh local
python3 src/auto_refresh_cookies.py --email youtubioviral@gmail.com

# Refresh + upload automático
python3 src/auto_refresh_cookies.py --email youtubioviral@gmail.com --upload
```

## 3. 🌐 Usar Proxy/VPN

### Opção 1: Proxy Residencial
```bash
# No .env
YT_DLP_PROXY=http://username:password@proxy.example.com:8080
```

### Opção 2: Rotação de Proxies
Use serviços como:
- Bright Data
- Oxylabs
- Smartproxy

### Opção 3: VPN no Servidor
```bash
# Instalar OpenVPN/WireGuard no servidor
# Configurar rota para yt-dlp usar VPN
```

## 4. 🤖 Headless Browser Avançado

### Usar Playwright com Stealth
O script `generate_cookies.py` já usa Playwright. Para melhorar:

```python
# Adicionar plugins anti-detecção
from playwright_stealth import stealth_async

# Usar fingerprinting aleatório
context = await browser.new_context(
    viewport={'width': 1920, 'height': 1080},
    user_agent=random_user_agent(),
    locale='en-US',
    timezone_id='America/New_York',
)
```

## 5. 📱 PO Tokens (Avançado)

PO Tokens são o novo sistema do YouTube. Requer extração manual:

1. Abrir DevTools no navegador
2. Ir para Network tab
3. Filtrar por "player"
4. Copiar o token da requisição
5. Usar no código (ver `download_alternative.py`)

## 6. 🔀 Múltiplas Contas

### Pool de Cookies

```bash
# Criar múltiplos arquivos de cookies
cookies_account1.txt
cookies_account2.txt
cookies_account3.txt

# Rotacionar no código
```

## 7. ⚡ Próximos Passos Recomendados

### Prioridade Alta
1. ✅ **Configurar auto-refresh de cookies** (cron job)
2. ✅ **Adicionar mais clientes** (já feito: mweb, tv_embedded)
3. ⏳ **Testar com proxy** (se tiver acesso)

### Prioridade Média
4. ⏳ **Implementar retry com backoff exponencial**
5. ⏳ **Adicionar logging detalhado**
6. ⏳ **Monitorar taxa de sucesso**

### Prioridade Baixa
7. ⏳ **PO Tokens** (complexo, requer manutenção manual)
8. ⏳ **Serviços de terceiros** (custo)

## 8. 🧪 Testar Melhorias

```bash
# Testar com novo código
python3 -c "from src.download import get_video_info; print(get_video_info('https://www.youtube.com/watch?v=u6sOPMwSh78'))"

# Verificar logs
./scripts/investigate_logs.sh -n 30
```

## 9. 📊 Monitoramento

Adicione métricas para:
- Taxa de sucesso por estratégia
- Tempo médio de resposta
- Erros mais comuns
- Quando cookies expiram

