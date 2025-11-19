# Quick Fix: JavaScript Runtime for yt-dlp

## Problem

yt-dlp version 2025.11.12+ requires an external JavaScript runtime for YouTube downloads, especially when using cookies.

## Solution

### 1. Verify Node.js is Installed

Your Dockerfile already installs Node.js 20.x, which is good! Verify it works:

```bash
docker-compose exec backend node --version
# Should show: v20.x.x
```

### 2. Install yt-dlp with Default Extras

The `yt-dlp-ejs` component is required. Install yt-dlp with the `[default]` extra:

**Option A: Update requirements.txt**
```txt
yt-dlp[default]>=2025.11.12
```

**Option B: Update Dockerfile**
```dockerfile
RUN pip install --no-cache-dir yt-dlp[default]
```

**Option C: Install manually on server**
```bash
docker-compose exec backend pip install yt-dlp[default]
```

### 3. Verify Installation

```bash
# Check yt-dlp version
docker-compose exec backend python3 -c "import yt_dlp; print(yt_dlp.__version__)"

# Check if yt-dlp-ejs is installed
docker-compose exec backend pip list | grep yt-dlp-ejs
# Should show: yt-dlp-ejs X.X.X

# Verify Node.js is accessible
docker-compose exec backend node --version
```

### 4. Test with Cookies

```bash
docker-compose exec backend python3 -c "
import yt_dlp
ydl = yt_dlp.YoutubeDL({'cookiefile': '/app/cookies.txt', 'quiet': True})
info = ydl.extract_info('https://www.youtube.com/watch?v=Wtx3rb2ij8I', download=False)
print('Success!' if info else 'Failed')
"
```

## Update Your Dockerfile

Add this to ensure yt-dlp-ejs is included:

```dockerfile
# Install yt-dlp with JavaScript runtime support
RUN pip install --no-cache-dir yt-dlp[default]
```

Or update your requirements.txt to include:
```
yt-dlp[default]>=2025.11.12
```

## Why This Matters

- **Without JS runtime**: Limited format availability, may not work with cookies
- **With JS runtime**: Full format support, cookies work properly, better YouTube compatibility

## References

- [EJS Wiki Page](https://github.com/yt-dlp/yt-dlp/wiki/EJS)
- [Issue #14404](https://github.com/yt-dlp/yt-dlp/issues/14404) - JavaScript runtime announcement

