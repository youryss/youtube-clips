# YouTube Cookies Setup Guide

## Problem
YouTube is detecting automated access and blocking yt-dlp requests with the error:
```
ERROR: [youtube] AVaXDAqkKAQ: Sign in to confirm you're not a bot.
```

## Solution
Export your browser cookies and configure yt-dlp to use them. This makes yt-dlp appear as a regular browser session.

## Method 1: Export Cookies File (Recommended)

### Step 1: Install Browser Extension

Install a cookie export extension in your browser:

**Chrome/Edge:**
- [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- [cookies.txt](https://chrome.google.com/webstore/detail/cookiestxt/njabckikapfpffapmjgojcnbfjonfjfg)

**Firefox:**
- [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

### Step 2: Export Cookies

1. Open YouTube in your browser and make sure you're logged in
2. Click the extension icon
3. Select `youtube.com` domain
4. Click "Export" or "Copy"
5. Save the cookies to a file named `cookies.txt` in the project root

### Step 3: Configure Docker Compose

The `docker-compose.yml` is already configured to mount `cookies.txt`. Just make sure:

1. The `cookies.txt` file exists in the project root
2. Set the environment variable in your `.env` file:

```bash
YT_DLP_COOKIES=/app/cookies.txt
```

Or if you want to use a different path:

```bash
YT_DLP_COOKIES=/path/to/your/cookies.txt
```

### Step 4: Restart Services

```bash
docker-compose restart backend
```

## Method 2: Use Browser Name (Alternative)

If you're running on a system with a browser installed, you can use:

```bash
YT_DLP_COOKIES=chrome
```

Or for Firefox:
```bash
YT_DLP_COOKIES=firefox
```

**Note:** This only works if the browser is installed on the same system. For Docker containers, use Method 1.

## Method 3: Manual Cookie Export (Advanced)

If you prefer to export cookies manually:

1. **Using yt-dlp directly:**
   ```bash
   yt-dlp --cookies-from-browser chrome --cookies cookies.txt "https://www.youtube.com/watch?v=VIDEO_ID"
   ```

2. **Using browser developer tools:**
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Copy cookies manually (not recommended, tedious)

## Verification

After setting up cookies, test with:

```bash
docker-compose exec backend python -c "
from src.download import get_video_info
info = get_video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
print('Success!' if info else 'Failed'
"
```

## Important Notes

1. **Cookie Expiration:** Cookies expire after some time. You'll need to re-export them periodically (usually every few weeks to months).

2. **Security:** The `cookies.txt` file contains your session cookies. Keep it secure and don't commit it to git (it should be in `.gitignore`).

3. **Multiple Browsers:** If you use multiple browsers, export cookies from the one where you're logged into YouTube.

4. **Docker Volume:** The `cookies.txt` file is mounted as read-only (`:ro`) for security.

## Troubleshooting

### Cookies not working?
- Make sure you're logged into YouTube in the browser before exporting
- Verify the cookies.txt file is in Netscape format (should start with `# Netscape HTTP Cookie File`)
- Check file permissions: `chmod 644 cookies.txt`
- Ensure the path in `YT_DLP_COOKIES` matches the mounted path in Docker

### Still getting bot detection?
- Try exporting cookies again (they may have expired)
- Clear browser cache and cookies, log in fresh, then export
- Some videos may have additional restrictions - this is normal

### File not found error?
- Make sure `cookies.txt` exists in the project root
- Check the volume mount in `docker-compose.yml`
- Verify the path in `YT_DLP_COOKIES` environment variable

## Updating Cookies

When cookies expire:

1. Re-export cookies from your browser
2. Replace the `cookies.txt` file
3. Restart the backend: `docker-compose restart backend`

No need to rebuild the container!

