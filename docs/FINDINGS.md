# Findings from GitHub Issues Research

## Issues Encontradas

### 1. Issue #11783 (Dec 10, 2024) - **Fechada como duplicada**
**Link**: https://github.com/yt-dlp/yt-dlp/issues/11783

**Problema Similar:**
- Erro ocorre quando usa cookies
- Funciona sem cookies
- Após ~12 horas funciona, mas se o IP mudar, volta a dar erro
- Erro relacionado a: `nsig extraction failed` e `Only images are available for download`

**Causa Identificada:**
- YouTube bloqueando requisições quando detecta cookies inválidos/expirados
- Problemas com extração de assinatura (nsig) quando cookies estão inválidos
- YouTube retorna apenas formatos de imagem (storyboard) quando bloqueado

### 2. Issue #13058 (Apr 30, 2025) - **Aberta**
**Link**: https://github.com/yt-dlp/yt-dlp/issues/13058

**Problema:**
- Formatos listados como disponíveis mas falham ao baixar
- Erro: `Unable to download format 231. Skipping...`
- Relacionado a formatos iOS que requerem GVS PO Token

### 3. Issue #11295 (Oct 20, 2024) - **Fechada**
**Link**: https://github.com/yt-dlp/yt-dlp/issues/11295

**Problema:**
- Erro ao selecionar formatos específicos
- Alguns vídeos não têm o formato solicitado disponível

## Soluções Recomendadas

### 1. **Atualizar yt-dlp** (Mais Importante!)
A maioria das issues menciona que atualizar resolve o problema:
```bash
pip install -U yt-dlp
# ou
yt-dlp -U
```

### 2. **Regenerar Cookies**
Se os cookies estão expirados ou inválidos:
- Use `src/generate_cookies.py` para gerar novos cookies
- Cookies podem expirar após ~12 horas ou mudança de IP

### 3. **Problema com IP/Cookies**
- YouTube pode bloquear quando detecta cookies inválidos
- Pode retornar apenas formatos de imagem (storyboard)
- Solução: Regenerar cookies ou aguardar ~12 horas

### 4. **Usar Formatos Mais Flexíveis**
Em vez de formatos específicos, usar:
```python
'format': 'best/bestvideo+bestaudio/best'
```

## Próximos Passos Recomendados

1. ✅ **Verificar versão do yt-dlp no servidor**
2. ✅ **Atualizar yt-dlp para a versão mais recente**
3. ✅ **Regenerar cookies** usando `src/generate_cookies.py`
4. ✅ **Testar sem cookies** para verificar se o problema é específico de cookies

## Links Úteis

- [Issue #11783](https://github.com/yt-dlp/yt-dlp/issues/11783) - Problema com cookies/IP
- [Issue #13058](https://github.com/yt-dlp/yt-dlp/issues/13058) - Formatos listados mas não disponíveis
- [Issue #11295](https://github.com/yt-dlp/yt-dlp/issues/11295) - Seleção de formatos
- [yt-dlp Issues](https://github.com/yt-dlp/yt-dlp/issues?q=Requested+format+is+not+available)

