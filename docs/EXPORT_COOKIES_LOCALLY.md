# Export Cookies on Your Local Machine

Since you're running the app on a remote server (DigitalOcean), you need to export cookies from your **local computer** where you have Chrome/Firefox installed, then upload the file to the server.

## Method 1: Browser Extension (Easiest)

### Chrome/Edge on Your Local Machine:

1. **Install the extension** on your local Chrome/Edge:
   - [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)

2. **Export cookies**:
   - Open YouTube in your local browser (make sure you're logged in)
   - Click the extension icon
   - Select `youtube.com` domain
   - Click "Export" or "Copy"
   - The cookies will be copied to your clipboard

3. **Create cookies.txt**:
   ```bash
   # On your local machine, in the project directory
   # Paste the copied content into a new file
   nano cookies.txt
   # Or use your text editor to create cookies.txt and paste the content
   ```

4. **Upload to server**:
   ```bash
   # Using SCP (replace with your server details)
   scp cookies.txt user@164.90.193.41:/path/to/youtube-viral-clipper/
   
   # Or using SFTP, or just copy-paste the content via SSH
   ```

### Firefox on Your Local Machine:

1. Install: [cookies.txt extension](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)
2. Same process: Open YouTube, export, save as `cookies.txt`
3. Upload to server

## Method 2: Using yt-dlp on Your Local Machine

If you have yt-dlp installed **on your local computer** (not the server):

```bash
# On your LOCAL machine (where Chrome is installed)
yt-dlp --cookies-from-browser chrome --cookies cookies.txt "https://www.youtube.com"

# This will create cookies.txt on your local machine
# Then upload it to the server
```

## Method 3: Manual Browser Export (Advanced)

1. **Chrome DevTools Method**:
   - Open YouTube in Chrome
   - Press F12 to open DevTools
   - Go to Application tab → Cookies → https://www.youtube.com
   - Manually copy cookies (tedious, not recommended)

2. **Use browser's cookie export feature**:
   - Some browsers have built-in cookie export (varies by browser)

## Uploading to Server

### Option A: SCP (Secure Copy)

```bash
# From your local machine
scp cookies.txt root@164.90.193.41:/root/youtube-viral-clipper/
```

### Option B: SFTP

```bash
# Connect via SFTP
sftp root@164.90.193.41
# Then: put cookies.txt /root/youtube-viral-clipper/
```

### Option C: Direct Edit on Server

```bash
# SSH into server
ssh root@164.90.193.41

# Create file
nano /root/youtube-viral-clipper/cookies.txt

# Paste the cookie content (from browser extension)
# Save and exit (Ctrl+X, then Y, then Enter)
```

### Option D: Using Docker Volume (If using docker-compose)

If you're using docker-compose, you can:

1. Create `cookies.txt` on your local machine
2. Place it in the project root (same directory as docker-compose.yml)
3. The volume mount in docker-compose.yml will automatically make it available in the container

## Verify on Server

After uploading, verify the file exists:

```bash
# On the server
ls -la cookies.txt
head -n 5 cookies.txt  # Should show "# Netscape HTTP Cookie File"
```

## Important Notes

- **Cookies expire**: You'll need to re-export them periodically (every few weeks/months)
- **Keep it secure**: Don't commit cookies.txt to git (it's already in .gitignore)
- **Must be logged in**: Make sure you're logged into YouTube when exporting cookies
- **File format**: The file should start with `# Netscape HTTP Cookie File`

## Troubleshooting

**File not found after upload?**
- Check the path: `pwd` to see current directory
- Make sure you're in the project root where docker-compose.yml is located

**Cookies not working?**
- Verify file format (should start with `# Netscape HTTP Cookie File`)
- Check file permissions: `chmod 644 cookies.txt`
- Make sure you were logged into YouTube when exporting
- Try re-exporting (cookies may have expired)

