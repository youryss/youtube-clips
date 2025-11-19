# yt-dlp Issue: Cookies Strategy Not Working on Digital Ocean

## Environment

- **Platform**: Digital Ocean (Linux/Docker)
- **Python Version**: 3.11
- **yt-dlp Version**: (Check with `python3 -c "import yt_dlp; print(yt_dlp.__version__)"`)
- **JavaScript Runtime**: Node.js 20.x (installed in Dockerfile)
- **yt-dlp-ejs**: (Check if installed with `pip list | grep yt-dlp-ejs`)
- **OS**: Linux (Docker container based on `python:3.11-slim`)

## Problem Description

When running yt-dlp on Digital Ocean with cookies configured, the download fails even though:
1. Cookies file exists and is properly formatted (Netscape format)
2. Cookies contain valid YouTube session data
3. The same setup works locally (or worked previously)
4. Node.js 20.x is installed and available

The cookies strategy is being used as a fallback when downloads without cookies fail, but it's not working in the Digital Ocean environment.

## yt-dlp Version

**Note**: Please check the actual version on your server with:
```bash
docker-compose exec backend python3 -c "import yt_dlp; print(yt_dlp.__version__)"
```

If you're using yt-dlp version **2025.11.12 or later**, please also verify:
1. That `yt-dlp-ejs` is installed: `pip list | grep yt-dlp-ejs`
2. That Node.js is accessible: `node --version` (should show v20.x or later)
3. That yt-dlp can detect Node.js: Check logs for any JS runtime warnings

## How We're Using Cookies

### Cookie File Configuration

Cookies are provided via environment variable `YT_DLP_COOKIES` pointing to a Netscape-format cookie file:

```bash
YT_DLP_COOKIES=/app/cookies.txt
```

The cookie file is mounted as read-only in Docker:
```yaml
volumes:
  - ./cookies.txt:/app/cookies.txt:ro
```

### Code Example: Download with Cookies

Here's how we're using yt-dlp with cookies in our codebase:

```python
import yt_dlp
from pathlib import Path

def download_video(url: str, output_dir: str, quality: str = "1080p"):
    """Download video from YouTube with cookie support"""
    
    # Base options
    base_opts = {
        'format': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        'outtmpl': str(Path(output_dir) / '%(title)s.%(ext)s'),
        'merge_output_format': 'mp4',
        'quiet': False,
        'no_warnings': False,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.youtube.com/',
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
            }
        },
        'format_sort': ['res', 'ext:mp4:m4a', 'codec:h264', 'acodec:aac'],
    }
    
    # Strategy 1: Without cookies (tried first)
    strategies = [{**base_opts}]
    
    # Strategy 2: With cookies if configured
    cookie_file = os.getenv('YT_DLP_COOKIES', '')
    if cookie_file and Path(cookie_file).exists():
        opts_with_cookies = {**base_opts, 'cookiefile': cookie_file}
        strategies.append(opts_with_cookies)
    
    # Try each strategy
    for ydl_opts in strategies:
        try:
            ydl = yt_dlp.YoutubeDL(ydl_opts)
            
            # Disable cookie saving (file is read-only in Docker)
            if hasattr(ydl, 'save_cookies'):
                ydl.save_cookies = lambda: None
            
            # Extract info
            info = ydl.extract_info(url, download=False)
            
            if info and info.get('title'):
                # Download video
                ydl.download([url])
                return {'success': True, 'title': info.get('title')}
                
        except Exception as e:
            print(f"Strategy failed: {e}")
            continue
    
    return {'success': False, 'error': 'All strategies failed'}
```

### Cookie File Location and Format

- **Path**: `/app/cookies.txt` (inside Docker container)
- **Format**: Netscape cookie format
- **Permissions**: Read-only (mounted as `:ro` in Docker)
- **Content**: Contains YouTube session cookies including:
  - `__Secure-3PSID`
  - `__Secure-3PAPISID`
  - `LOGIN_INFO`
  - Other YouTube authentication cookies

### Cookie File Verification

We verify the cookie file exists and contains YouTube cookies:

```python
if Path(cookie_file).exists():
    file_size = Path(cookie_file).stat().st_size
    print(f"Cookie file verified: {cookie_file} ({file_size} bytes)")
    
    with open(cookie_file, 'r') as f:
        content = f.read()
        if 'youtube.com' in content or '.youtube.com' in content:
            print("YouTube cookies found in file")
        else:
            print("WARNING: No YouTube cookies found in file")
```

## Error Messages

When cookies strategy fails, we typically see one of these errors:

1. **Format not available**:
   ```
   ERROR: [youtube] <VIDEO_ID>: Requested format is not available. Use --list-formats for a list of available formats
   ```

2. **Sign in required**:
   ```
   ERROR: [youtube] <VIDEO_ID>: Sign in to confirm your age
   ```

3. **Only images available**:
   ```
   ERROR: [youtube] <VIDEO_ID>: Only images are available for download
   ```

4. **nsig extraction failed** (when using cookies):
   ```
   ERROR: [youtube] <VIDEO_ID>: nsig extraction failed
   ```

## What We've Tried

1. ✅ Verified cookie file exists and is readable
2. ✅ Confirmed cookies contain valid YouTube session data
3. ✅ Tested with fresh cookies (generated via Playwright)
4. ✅ Tried different `player_client` options: `['android', 'web']`, `['ios']`, `['web']`
5. ✅ Tested with and without `extract_flat`
6. ✅ Verified file permissions (read-only is intentional)
7. ✅ Tried multiple video URLs (not video-specific)
8. ✅ Updated yt-dlp to latest version
9. ✅ Verified Node.js is installed and accessible

## Expected Behavior

When using cookies:
1. yt-dlp should authenticate using the provided cookies
2. Downloads should work for age-restricted or logged-in content
3. Format availability should be better than without cookies
4. Should work consistently on Digital Ocean (same as local)

## Actual Behavior

1. Downloads without cookies work (but limited format availability)
2. Downloads with cookies fail on Digital Ocean
3. Same cookies work locally (or in other environments)
4. Error suggests YouTube is not recognizing the cookies or blocking the request

## Additional Context

### Docker Setup

Our Dockerfile installs Node.js 20.x:
```dockerfile
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs
```

### yt-dlp Installation

yt-dlp is installed via pip (not explicitly listed in requirements.txt):
```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

**Note**: We should verify that yt-dlp is installed with the `[default]` extra to ensure `yt-dlp-ejs` is included:
```bash
pip install yt-dlp[default]
```

Or explicitly add to requirements.txt:
```
yt-dlp[default]>=2025.11.12
```

### JavaScript Runtime Requirement

**Important**: We're aware that yt-dlp 2025.11.12+ requires an external JavaScript runtime for YouTube. We have:
- ✅ Node.js 20.x installed
- ❓ Need to verify `yt-dlp-ejs` is installed
- ❓ Need to verify yt-dlp can detect and use Node.js

Please confirm:
1. Is `yt-dlp-ejs` automatically included when installing yt-dlp via pip?
2. Should we explicitly install it: `pip install yt-dlp[default]`?
3. How can we verify yt-dlp is using the JavaScript runtime?

## Minimal Reproduction

```python
import yt_dlp
import os

url = "https://www.youtube.com/watch?v=Wtx3rb2ij8I"  # Example video
cookie_file = "/app/cookies.txt"  # Path in Docker container

ydl_opts = {
    'cookiefile': cookie_file,
    'quiet': False,
    'no_warnings': False,
}

try:
    ydl = yt_dlp.YoutubeDL(ydl_opts)
    info = ydl.extract_info(url, download=False)
    print(f"Success: {info.get('title')}")
except Exception as e:
    print(f"Error: {e}")
```

## System Information

```bash
# Python version
python3 --version  # Python 3.11.x

# yt-dlp version
python3 -c "import yt_dlp; print(yt_dlp.__version__)"

# Node.js version
node --version  # Should show v20.x.x

# yt-dlp-ejs
pip list | grep yt-dlp-ejs

# Cookie file
ls -lh /app/cookies.txt
head -5 /app/cookies.txt  # First few lines (without sensitive data)
```

## Questions

1. **JavaScript Runtime**: Since we have Node.js 20.x installed, should yt-dlp automatically detect and use it? Or do we need to configure something?

2. **yt-dlp-ejs**: Is this component automatically installed with `pip install yt-dlp`, or do we need `pip install yt-dlp[default]`?

3. **Cookie Format**: Are there any specific requirements for cookie format when using JavaScript runtime?

4. **Digital Ocean Specific**: Are there any known issues with yt-dlp on Digital Ocean or similar cloud providers?

5. **Cookie Validation**: How can we verify that yt-dlp is actually using the cookies we provide?

## Related Issues

- #14404 - Announcement about JavaScript runtime requirement
- #11783 - Similar cookie/IP issues (closed as duplicate)
- #13058 - Format availability issues

---

**Note**: This issue is specifically about cookies not working on Digital Ocean, even though the same setup works locally. We're aware of the JavaScript runtime requirement and have Node.js installed, but need guidance on ensuring yt-dlp can use it properly.

