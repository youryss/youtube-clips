# Quick Upload Reference

## 🚀 Ready to Upload?

Your credentials are configured! You have **5 clips** ready to upload.

---

## ✅ What You Have

| Video              | Clips   | Status   |
| ------------------ | ------- | -------- |
| Steam Frame VR     | 4 clips | ✅ Ready |
| Silent Stud Dating | 1 clip  | ✅ Ready |

---

## 📤 Upload Commands

### 🎯 Interactive Mode (RECOMMENDED - Choose Clips)

```bash
# Activate environment
source venv/bin/activate

# Interactive upload - choose which clips to upload
python src/upload_clips.py -i
```

**What happens:**

1. Shows you all available videos
2. You pick which video
3. Shows clip details (title, score, duration)
4. You select which clips (1,3 or all)
5. Uploads to YouTube Shorts as **private**

---

### 📹 Upload Specific Video

```bash
# Upload Steam Frame clips only
python src/upload_clips.py --video "Steam Frame" -i

# Upload dating show clip
python src/upload_clips.py --video "Silent" -i
```

---

### 🎬 Upload Specific Clips (No Interaction)

```bash
# Upload clips 1 and 2 from Steam Frame
python src/upload_clips.py --video "Steam Frame" --clips 1,2

# Upload all clips (no questions asked)
python src/upload_clips.py
```

---

### 🧪 Test First (Dry Run)

```bash
# See what would be uploaded WITHOUT actually uploading
python src/upload_clips.py -i --dry-run
```

---

## 🔐 Privacy Options

### Private (Default - Safe for Testing)

```bash
python src/upload_clips.py -i
```

Only you can see it ✅

### Unlisted (Shareable Link)

```bash
python src/upload_clips.py -i --privacy unlisted
```

Anyone with link can watch 🔗

### Public (Everyone Can See)

```bash
python src/upload_clips.py -i --privacy public
```

Searchable on YouTube 🌍

---

## 💡 Pro Tips

1. **Always start with private**

   ```bash
   python src/upload_clips.py -i --privacy private
   ```

2. **Test with dry-run first**

   ```bash
   python src/upload_clips.py -i --dry-run
   ```

3. **Upload best clips only**

   - Use interactive mode (`-i`)
   - Review scores and titles
   - Select only high-scoring clips (7.5+)

4. **Make public later**
   - Upload as private
   - Review in [YouTube Studio](https://studio.youtube.com/)
   - Change privacy to public for best ones

---

## 🎯 Recommended Workflow

```bash
# Step 1: Test what will be uploaded
python src/upload_clips.py -i --dry-run

# Step 2: Upload as private
python src/upload_clips.py -i --privacy private

# Step 3: Check uploads in YouTube Studio
# https://studio.youtube.com/

# Step 4: Make best ones public manually
```

---

## ⚡ Quick Examples

### Upload Best Steam Frame Clips

```bash
python src/upload_clips.py --video "Steam Frame" -i
# Then select clips with score 7.5+
```

### Upload All Clips at Once

```bash
python src/upload_clips.py --privacy private
```

### Upload with Custom Tags

```bash
python src/upload_clips.py -i \
  --tags "VR,Gaming,Technology" \
  --privacy unlisted
```

---

## 📊 Your Current Clips

### Steam Frame VR (4 clips)

1. **FOV-ated Streaming** - 24s - Score: 7.5/10 ⭐
2. **VR Gaming Evolution** - 28s - Score: 7.5/10 ⭐
3. **Redefining Comfort** - 24s - Score: 7.0/10
4. **How Frame Redefines** - 24s - Score: 7.0/10

### Silent Stud Dating (1 clip)

1. **Spitting Gum on Cards** - 16s - Score: 8.0/10 ⭐⭐

**Recommendation:** Upload clips with ⭐ (score 7.5+) first!

---

## 🆘 First Upload

When you run the command for the first time:

1. **Browser will open automatically**
2. **Sign in to your Google account**
3. **Click "Allow" to grant permissions**
4. **Done!** Credentials saved for next time

This only happens once. After that, uploads are automatic.

---

## 🎬 Ready?

Try this now:

```bash
source venv/bin/activate
python src/upload_clips.py -i --dry-run
```

Then when ready:

```bash
python src/upload_clips.py -i
```

Good luck! 🚀
