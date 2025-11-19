# ✅ Auto-Refresh de Cookies Configurado!

## O que foi configurado

Um cron job foi configurado na sua máquina local para:
1. **Regenerar cookies** a cada 6 horas
2. **Fazer upload automático** para o servidor
3. **Reiniciar o backend** automaticamente

## Como funciona

O cron job executa:
```bash
0 */6 * * * cd /Users/yourystancato/youtube-viral-clipper && python3 src/auto_refresh_cookies.py --email youtubioviral@gmail.com --output cookies.txt --upload
```

**Frequência**: A cada 6 horas (00:00, 06:00, 12:00, 18:00)

## Gerenciar o cron job

### Ver cron jobs
```bash
crontab -l
```

### Remover cron job
```bash
crontab -l | grep -v "auto_refresh_cookies" | crontab -
```

### Editar cron jobs
```bash
crontab -e
```

### Testar manualmente
```bash
python3 src/auto_refresh_cookies.py --email youtubioviral@gmail.com --output cookies.txt --upload
```

## Logs

Os logs são salvos via `logger` e podem ser visualizados:
```bash
# macOS
log show --predicate 'subsystem == "com.apple.console"' --last 1h | grep youtube-cookie-refresh

# Ou verificar logs do script diretamente
tail -f ~/Library/Logs/youtube-cookie-refresh.log  # se configurado
```

## Importante

- ⚠️ **O navegador abrirá** quando o cron job executar
- ⚠️ **Você precisará fazer login** manualmente (se não tiver sessão salva)
- ✅ **O upload é automático** após gerar os cookies

## Alternativa: Executar apenas quando necessário

Se preferir não ter o cron job automático, você pode:

1. **Remover o cron job**:
   ```bash
   crontab -l | grep -v "auto_refresh_cookies" | crontab -
   ```

2. **Executar manualmente quando necessário**:
   ```bash
   ./scripts/generate_and_upload_cookies.sh
   ```

## Status

✅ **Cron job configurado e ativo!**

Os cookies serão atualizados automaticamente a cada 6 horas.

