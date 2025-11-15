# Upload Guide

Guide for uploading viral clips to social media platforms.

## Quick Start

### Interactive Mode (Recommended)

The easiest way to upload clips is using interactive mode:

```bash
# Activate environment
source venv/bin/activate

# Run interactive upload
python src/upload_clips.py --interactive
```

This will:

1. Show you all available videos
2. Let you select which video's clips to upload
3. Show clip details (title, duration, score)
4. Let you choose specific clips to upload
5. Upload to YouTube Shorts

---

## Usage Examples

### 1. Interactive Upload (Choose Everything)

```bash
python src/upload_clips.py -i
```

You'll see:

```
Available Videos
======================================================================
1. Steam Frame First Impressions
   (3 clips)
2. Silent Stud Tries To Pick Up Hotties
   (1 clip)

Your selection: 1
```

Then select which clips:

```
📹 Clip #1
   Title: The Future of VR: How FOV-ated Streaming Changes Everything
   Duration: 24s
   Score: 7.5/10

📹 Clip #2
   Title: Reflecting on VR Gaming's Evolution
   Duration: 28s
   Score: 7.5/10

Your selection: 1,2  (or 'all')
```

### 2. Upload Specific Video's Clips

```bash
# Upload all clips from Steam Frame video
python src/upload_clips.py --video "Steam Frame"

# With interactive clip selection
python src/upload_clips.py --video "Steam Frame" -i
```

### 3. Upload Specific Clip Numbers

```bash
# Upload clips 1 and 3
python src/upload_clips.py --clips 1,3

# From specific video
python src/upload_clips.py --video "Steam Frame" --clips 1,2
```

### 4. Upload All Clips

```bash
# Upload all clips (no interaction)
python src/upload_clips.py
```

### 5. Dry Run (Preview Without Uploading)

```bash
# See what would be uploaded without actually uploading
python src/upload_clips.py -i --dry-run
```

---

## Command Line Options

| Option          | Short | Description                               | Example                   |
| --------------- | ----- | ----------------------------------------- | ------------------------- |
| `--interactive` | `-i`  | Interactive selection mode                | `-i`                      |
| `--video`       |       | Filter by video name                      | `--video "Steam Frame"`   |
| `--clips`       |       | Specific clip numbers                     | `--clips 1,3,5`           |
| `--privacy`     |       | YouTube privacy (private/unlisted/public) | `--privacy unlisted`      |
| `--no-shorts`   |       | Don't optimize for Shorts                 | `--no-shorts`             |
| `--tags`        |       | Additional tags                           | `--tags "Gaming,VR,Tech"` |
| `--dry-run`     |       | Preview without uploading                 | `--dry-run`               |
| `--platform`    |       | Target platform                           | `--platform youtube`      |
| `--filter`      |       | Filter by filename                        | `--filter "clip01"`       |

---

## Privacy Settings

### Private (Default)

- Only you can see the video
- Good for testing

```bash
python src/upload_clips.py -i --privacy private
```

### Unlisted

- Anyone with the link can watch
- Not searchable on YouTube

```bash
python src/upload_clips.py -i --privacy unlisted
```

### Public

- Everyone can see and search for it

```bash
python src/upload_clips.py -i --privacy public
```

---

## Advanced Examples

### Upload Best Clips Only

```bash
# View all clips interactively, choose the best ones
python src/upload_clips.py -i --privacy public
```

### Upload with Custom Tags

```bash
python src/upload_clips.py \
  --video "Steam Frame" \
  --tags "VR,Gaming,SteamDeck,Technology" \
  --privacy unlisted
```

### Test Before Uploading

```bash
# 1. Dry run to see what will be uploaded
python src/upload_clips.py -i --dry-run

# 2. If happy, upload for real
python src/upload_clips.py -i
```

---

## First Time Setup

### 1. Authentication

The first time you upload, a browser will open asking you to:

1. Sign in to your Google account
2. Grant permission to upload videos
3. Authorize the app

After this, credentials are saved to `youtube_token.json` and you won't need to re-authenticate.

### 2. Privacy Notice

Your app will be in "Testing" mode, which means:

- ✅ You can upload up to ~6 videos per day (10,000 quota units)
- ✅ Perfect for personal use
- ⚠️ Only the email you added as a "test user" can authorize

---

## Troubleshooting

### "Authentication failed"

- Check that `client_secrets.json` exists
- Make sure your email is added as a test user in Google Cloud Console
- Try deleting `youtube_token.json` and re-authenticating

### "Quota exceeded"

- YouTube API has daily limits (10,000 units)
- Each upload costs ~1,600 units (6 videos/day)
- Wait 24 hours for quota to reset

### "Invalid credentials"

- Delete `youtube_token.json`
- Run upload command again
- Complete authentication in browser

### "No clips found"

- Make sure you've run `python src/main.py` first to generate clips
- Check that clips exist in the `output/` directory

---

## Tips

1. **Start with Private**: Always upload as private first to review before making public

2. **Use Interactive Mode**: Much easier to select the best clips

3. **Test with Dry Run**: Preview what will be uploaded

   ```bash
   python src/upload_clips.py -i --dry-run
   ```

4. **Check Your Uploads**: Visit [YouTube Studio](https://studio.youtube.com/) to manage uploaded videos

5. **Customize Descriptions**: Edit metadata in YouTube Studio after upload for better SEO

6. **Monitor Quota**: Check your quota usage in [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)

---

## Platform Support

### ✅ YouTube (Working)

- YouTube Shorts support
- Automatic #Shorts optimization
- Full metadata support
- OAuth 2.0 authentication

### 🚧 Coming Soon

- TikTok (requires API approval)
- Instagram Reels (requires business account)
- Twitter/X (requires elevated access)

---

## Example Workflow

```bash
# 1. Generate clips from videos
python src/main.py

# 2. Review clips interactively
python src/upload_clips.py -i --dry-run

# 3. Upload selected clips
python src/upload_clips.py -i --privacy private

# 4. Check uploads in YouTube Studio

# 5. Make best ones public
# (do this manually in YouTube Studio)
```

---

## Need Help?

Common issues:

- Authentication problems → Delete `youtube_token.json` and try again
- No clips found → Run `python src/main.py` first
- Quota exceeded → Wait 24 hours

For more help, check the [README.md](README.md) or open an issue.
