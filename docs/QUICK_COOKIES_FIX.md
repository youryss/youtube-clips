# Quick Fix: YouTube Bot Detection

## What Was Fixed

Added cookie support to yt-dlp to bypass YouTube's bot detection. The code now automatically uses cookies if configured.

## Quick Setup (3 Steps)

### 1. Export Cookies from Browser

**Chrome/Edge:**
- Install: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- Open YouTube, click extension, export cookies
- Save as `cookies.txt` in project root

**Firefox:**
- Install: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)
- Same process

### 2. Add to .env File

Add this line to your `.env` file:

```bash
YT_DLP_COOKIES=/app/cookies.txt
```

### 3. Restart Backend

```bash
docker-compose restart backend
```

That's it! The bot detection error should be resolved.

## Full Documentation

See [YOUTUBE_COOKIES_SETUP.md](YOUTUBE_COOKIES_SETUP.md) for detailed instructions and troubleshooting.

