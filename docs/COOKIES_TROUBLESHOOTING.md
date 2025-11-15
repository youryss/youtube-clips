# Cookies Troubleshooting Guide

## Check if Cookies are Being Loaded

After restarting the backend, check the logs for cookie-related messages:

```bash
docker-compose logs backend | grep -i cookie
```

You should see messages like:
- `[config] YT_DLP_COOKIES loaded: /app/cookies.txt`
- `[yt-dlp] Cookie config found: /app/cookies.txt`
- `[yt-dlp] Cookie file verified: /app/cookies.txt (1234 bytes)`

## Common Issues

### 1. Environment Variable Not Set

**Symptom:** Logs show `[config] YT_DLP_COOKIES not set`

**Fix:**
1. Check your `.env` file has:
   ```bash
   YT_DLP_COOKIES=/app/cookies.txt
   ```
2. Restart backend: `docker-compose restart backend`

### 2. Cookies File Not Found

**Symptom:** Logs show `[yt-dlp] WARNING: Cookie file does not exist`

**Fix:**
1. Verify `cookies.txt` exists in project root:
   ```bash
   ls -la cookies.txt
   ```
2. Check file is mounted in Docker:
   ```bash
   docker-compose exec backend ls -la /app/cookies.txt
   ```
3. If file doesn't exist in container, check docker-compose.yml volume mount

### 3. Cookies File Empty or Invalid

**Symptom:** Cookies file exists but still getting bot detection

**Fix:**
1. Check file size (should be > 0):
   ```bash
   docker-compose exec backend ls -lh /app/cookies.txt
   ```
2. Verify file format (should start with `# Netscape HTTP Cookie File`):
   ```bash
   docker-compose exec backend head -n 1 /app/cookies.txt
   ```
3. Re-export cookies from browser (they may have expired)

### 4. Wrong Path in Container

**Symptom:** Path resolution issues

**Fix:**
- Use absolute path in `.env`: `YT_DLP_COOKIES=/app/cookies.txt`
- This matches the Docker volume mount: `./cookies.txt:/app/cookies.txt:ro`

## Quick Diagnostic Commands

```bash
# Check if environment variable is set in container
docker-compose exec backend env | grep YT_DLP_COOKIES

# Check if cookies file exists in container
docker-compose exec backend ls -la /app/cookies.txt

# Check cookies file content (first few lines)
docker-compose exec backend head -n 5 /app/cookies.txt

# Check file size
docker-compose exec backend wc -l /app/cookies.txt

# Test yt-dlp with cookies directly
docker-compose exec backend python -c "
from src.download import _get_ytdlp_base_opts
opts = _get_ytdlp_base_opts()
print('Cookie options:', opts)
"
```

## Step-by-Step Verification

1. **Export cookies** from browser to `cookies.txt` in project root
2. **Verify file exists:**
   ```bash
   ls -la cookies.txt
   ```
3. **Add to .env:**
   ```bash
   echo "YT_DLP_COOKIES=/app/cookies.txt" >> .env
   ```
4. **Restart backend:**
   ```bash
   docker-compose restart backend
   ```
5. **Check logs:**
   ```bash
   docker-compose logs -f backend | grep -i cookie
   ```
6. **Try processing a video** and check if cookie messages appear

## Still Not Working?

1. **Check Docker volume mount:**
   - In `docker-compose.yml`, verify: `./cookies.txt:/app/cookies.txt:ro`
   - File must exist on host at `./cookies.txt`

2. **Try absolute path on host:**
   - Find full path: `pwd` + `/cookies.txt`
   - Update docker-compose.yml volume to use absolute path

3. **Verify cookies are valid:**
   - Cookies expire! Re-export if they're old
   - Make sure you're logged into YouTube when exporting

4. **Check file permissions:**
   ```bash
   chmod 644 cookies.txt
   ```

5. **Rebuild container** (if code changes were made):
   ```bash
   docker-compose up -d --build backend
   ```

