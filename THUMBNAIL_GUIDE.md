# Thumbnail Generation Guide

## Overview

The YouTube Viral Clipper now includes automatic thumbnail generation with AI-powered frame selection and enhancement. Thumbnails are generated during the upload process and automatically uploaded to YouTube.

## Features

### 🎯 Automatic Frame Selection
- Extracts multiple frames from your clip
- Analyzes each frame for quality (sharpness, brightness)
- Detects faces and prefers frames with people
- Selects the best frame automatically

### 🎨 Enhancement Modes

#### 1. None (Default)
No thumbnail generation - uses YouTube's auto-generated thumbnail.

#### 2. Basic Enhancement
- Adds text overlay with your clip title
- Displays viral score badge in top-right corner
- Color-coded badge (🟢 Green 8+, 🟡 Yellow 7-8, 🔴 Red <7)
- Enhances sharpness and contrast
- Fast and free

#### 3. Advanced Enhancement
- Includes all basic enhancements
- Additional AI-powered color enhancement
- Boosted saturation and contrast
- Professional thumbnail optimization
- Requires OpenAI API key

## Installation

First, install the new dependencies:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

This adds:
- **Pillow** - Image processing and text overlay
- **OpenCV** - Frame analysis and face detection  
- **NumPy** - Image calculations

## Usage

### Basic Usage

Upload with basic thumbnail enhancement:

```bash
python src/upload_clips.py -i --thumbnail basic
```

### Advanced Usage

Upload with AI-enhanced thumbnails:

```bash
python src/upload_clips.py -i --thumbnail advanced
```

### All Options

```bash
python src/upload_clips.py -i \
  --thumbnail basic \
  --thumbnail-frames 10 \
  --privacy private
```

### Command Options

| Option | Values | Description |
|--------|--------|-------------|
| `--thumbnail` | `none`, `basic`, `advanced` | Enhancement mode (default: `none`) |
| `--thumbnail-frames` | Number (default: 8) | How many frames to analyze |

## Examples

### 1. Upload All Clips with Basic Thumbnails

```bash
python src/upload_clips.py --thumbnail basic
```

### 2. Interactive Upload with Advanced Thumbnails

```bash
python src/upload_clips.py -i --thumbnail advanced
```

### 3. Test Thumbnails Without Uploading

```bash
python src/upload_clips.py -i --thumbnail basic --dry-run
```

### 4. Upload Specific Clips with Thumbnails

```bash
python src/upload_clips.py --video "Steam Frame" --clips 1,2 --thumbnail basic
```

## How It Works

### Frame Selection Process

1. **Extract Frames**: Takes 8-10 frames evenly spaced throughout the clip
2. **Analyze Quality**: 
   - Calculates sharpness using Laplacian variance
   - Measures brightness (prefers 80-180 range)
   - Detects faces using Haar Cascades
3. **Score Frames**: 
   - High sharpness = better score
   - Good brightness = bonus points
   - Faces detected = major bonus
4. **Select Winner**: Frame with highest score becomes thumbnail

### Basic Enhancement

```
┌─────────────────────────────────┐
│  🎬 Your Viral Clip Title      │ ← Semi-transparent overlay
├─────────────────────────────────┤
│                          [8.5]  │ ← Viral score badge
│                                 │
│        Video Frame              │
│                                 │
└─────────────────────────────────┘
```

- Title at top with shadow for readability
- Viral score badge with color coding
- Sharpened and contrast-enhanced

### Advanced Enhancement

Same as basic, plus:
- Boosted color saturation (30% increase)
- Enhanced contrast (20% increase)
- Extra sharpening
- Optimized for maximum visual impact

## Tips for Best Results

### 1. Use More Frames for Longer Clips

```bash
# For 60-second clips
python src/upload_clips.py -i --thumbnail basic --thumbnail-frames 12
```

### 2. Start with Basic

Basic enhancement is:
- ✅ Fast (< 2 seconds per thumbnail)
- ✅ Free (no API costs)
- ✅ Professional looking
- ✅ Perfect for most use cases

### 3. Use Advanced for Premium Content

Advanced mode is best for:
- High-value content
- Professional channels
- When you want maximum visual impact

### 4. Preview Before Upload

Always use `--dry-run` first:

```bash
python src/upload_clips.py -i --thumbnail basic --dry-run
```

### 5. Check Generated Thumbnails

Thumbnails are saved alongside clips:
```
output/Your_Video/
  ├── Your_Video_clip01.mp4
  ├── Your_Video_clip01_metadata.json
  └── Your_Video_clip01_thumbnail.jpg  ← Generated thumbnail
```

You can preview these before uploading!

## Troubleshooting

### "OpenCV not available" Warning

This is normal! Face detection is optional. Thumbnails will still work using sharpness and brightness analysis.

To enable face detection:
```bash
pip install opencv-python
```

### "Pillow not available" Error

This is required for thumbnails:
```bash
pip install Pillow
```

### Advanced Mode Falls Back to Basic

This happens when:
- OpenAI API key is not set
- API request fails

Solution:
```bash
# Make sure .env has your OpenAI key
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

### Thumbnail Upload Failed

Possible causes:
- Thumbnail file > 2MB (YouTube limit)
- Invalid image format
- Not verified with YouTube

Solution: YouTube requires channel verification to upload custom thumbnails. Visit [YouTube Studio](https://studio.youtube.com/) to verify your account.

## Cost Considerations

### Basic Enhancement
- **Cost**: Free
- **Speed**: ~2 seconds per thumbnail
- **Quality**: Excellent for most cases

### Advanced Enhancement  
- **Cost**: Free (uses local image enhancement)
- **Speed**: ~3 seconds per thumbnail
- **Quality**: Maximum visual impact

**Note**: Advanced mode currently uses enhanced local processing. In the future, it could integrate actual AI image generation APIs which would incur costs.

## Manual Thumbnail Generation

You can also generate thumbnails separately without uploading:

```python
from thumbnail_generator import generate_thumbnail_for_clip

thumbnail_path = generate_thumbnail_for_clip(
    video_path='output/MyVideo/MyVideo_clip01.mp4',
    metadata_path='output/MyVideo/MyVideo_clip01_metadata.json',
    enhancement_type='basic'  # or 'advanced'
)

print(f"Thumbnail saved: {thumbnail_path}")
```

## Best Practices

1. ✅ **Always use thumbnails** - They significantly increase click-through rates
2. ✅ **Start with basic** - It's fast, free, and looks great
3. ✅ **Preview thumbnails** - Check the generated files before uploading
4. ✅ **Use dry-run** - Test your settings first
5. ✅ **Verify your YouTube account** - Required for custom thumbnails

## Recommended Workflow

```bash
# Step 1: Generate clips (as usual)
cd src
python main.py

# Step 2: Preview with thumbnails (dry run)
python upload_clips.py -i --thumbnail basic --dry-run

# Step 3: Check generated thumbnails in output/ folders
ls -la ../output/*/thumbnails/

# Step 4: Upload for real
python upload_clips.py -i --thumbnail basic --privacy private

# Step 5: Review in YouTube Studio
# https://studio.youtube.com/
```

## FAQ

**Q: Do I need to generate thumbnails every time?**  
A: No, set `--thumbnail none` to skip. But thumbnails greatly improve performance!

**Q: Can I edit the thumbnails manually?**  
A: Yes! They're saved as `.jpg` files. Edit them in any image editor, then re-upload.

**Q: Will this work with my existing clips?**  
A: Yes! As long as you have the video file and metadata JSON.

**Q: What if I don't like the selected frame?**  
A: Increase `--thumbnail-frames` to analyze more options, or manually edit the saved thumbnail.

**Q: Can I use my own thumbnail?**  
A: Yes! The generated thumbnails are just starting points. Download, edit, and re-upload through YouTube Studio.

---

**Need help?** Check the main [README.md](README.md) or open an issue on GitHub.

**Happy thumbnail creating! 🎨**

