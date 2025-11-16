# ⚠️ Cookies Precisam Ser Regenerados

## Problema Atual

O YouTube está bloqueando todas as tentativas de extrair informações de vídeos:
- **Sem cookies**: "Sign in to confirm you're not a bot"
- **Com cookies**: "Requested format is not available" (cookies expirados/inválidos)

## Solução: Regenerar Cookies

Os cookies precisam ser regenerados usando o script `src/generate_cookies.py`.

### Passos:

1. **Localmente, execute o script de geração de cookies:**
   ```bash
   python3 src/generate_cookies.py
   ```

2. **O script irá:**
   - Abrir um navegador automatizado
   - Fazer login no YouTube (você precisará inserir email/senha e 2FA se necessário)
   - Exportar os cookies no formato Netscape
   - Salvar em `cookies.txt`

3. **Upload dos cookies para o servidor:**
   ```bash
   ./upload_cookies.sh
   ```

4. **Reiniciar o backend:**
   ```bash
   # O upload_cookies.sh já faz isso, mas se precisar manualmente:
   ssh root@164.90.193.41 "cd ~/youtube-viral-clipper && docker-compose restart backend"
   ```

## Estratégias Implementadas

O código agora tenta múltiplas estratégias em ordem:

1. **iOS client** (sem cookies) - Mais confiável
2. **Android client** (sem cookies)
3. **Web client** (sem cookies)
4. **Web client com cookies** (se configurado)

Se todas falharem, tenta também sem `extract_flat` como fallback final.

## Nota

Os cookies do YouTube geralmente expiram após:
- ~12 horas de uso
- Mudança de IP
- Detecção de atividade suspeita

É recomendado regenerar os cookies periodicamente ou quando começar a ver erros de autenticação.

