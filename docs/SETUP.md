# Quick Setup Guide

Follow these steps to get YouTube Viral Clipper up and running:

## 1. Install Dependencies

### Install ffmpeg (required)

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/ and add to PATH

### Install Python packages

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install requirements
pip install -r requirements.txt
```

## 2. Configure OpenAI API Key

Create a `.env` file in the project root:

```bash
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

Get your API key from: https://platform.openai.com/api-keys

## 3. Add Videos

Edit `videos.txt` and add YouTube URLs (one per line):

```
https://www.youtube.com/watch?v=example1
https://www.youtube.com/watch?v=example2
```

## 4. Run the Application

```bash
cd src
python main.py
```

## 5. Find Your Clips

Check the `output/` directory for your generated clips!

## Optional: Customize Settings

Edit `src/config.py` to adjust:
- Video quality
- Clip duration limits
- Viral score threshold
- Active criteria
- And more!

## Testing Your Setup

To verify everything is working:

1. Add a single short video URL to `videos.txt`
2. Run `cd src && python main.py`
3. Check for clips in `output/`

## Need Help?

Check the main README.md for detailed documentation and troubleshooting tips.

---

**Quick Reference Commands:**

```bash
# Activate environment
source venv/bin/activate

# Run the app
cd src && python main.py

# Deactivate when done
deactivate
```

