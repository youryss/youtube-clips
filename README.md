# YouTube Viral Clipper 🎬

An AI-powered CLI tool that automatically identifies and creates viral-worthy clips from YouTube videos. It downloads videos, transcribes them with timestamps, uses OpenAI's GPT-4 to analyze viral potential, and generates ready-to-post short-form content.

## ✨ Features

- 🤖 **AI-Powered Analysis**: Uses OpenAI GPT-4 to identify viral segments based on multiple criteria
- 🎯 **Multi-Criteria Evaluation**: Analyzes videos for viral hooks, emotional peaks, value bombs, and humor
- ⚡ **Automated Pipeline**: Complete workflow from URL to finished clips
- 📝 **Timestamp Transcription**: Accurate transcription with Whisper AI
- 🎬 **Smart Video Slicing**: Creates perfectly timed clips with configurable padding
- 📊 **Viral Scoring**: Ranks clips by viral potential (1-10 scale)
- 💾 **Metadata Tracking**: Saves detailed information about each clip
- ⚙️ **Highly Configurable**: Customize every aspect through simple configuration

## 🎯 Perfect For

- Content creators looking to repurpose long-form content
- Social media managers creating shorts/reels
- Video editors identifying best moments
- Marketers extracting key highlights

## 📋 Requirements

- Python 3.8 or higher
- ffmpeg (for video processing)
- OpenAI API key

### Installing ffmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

## 🚀 Installation

1. **Clone or download this repository**

2. **Create and activate a virtual environment** (recommended):
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
# macOS/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate
```

3. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set up your OpenAI API key**:
```bash
# Create .env file
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## 📖 Quick Start

1. **Add YouTube URLs** to `videos.txt`:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/jNQXAC9IVRw
```

2. **Run the application**:
```bash
cd src
python main.py
```

3. **Find your clips** in the `output/` directory!

Each video gets its own folder containing:
- `*_clip01.mp4`, `*_clip02.mp4`, etc. - The video clips
- `*_clip01_metadata.json` - Detailed information about each clip

## ⚙️ Configuration

Edit `src/config.py` or set environment variables to customize behavior:

### OpenAI Settings

```python
OPENAI_MODEL = "gpt-4-turbo-preview"  # or "gpt-4", "gpt-3.5-turbo"
```

### Whisper Settings

```python
WHISPER_MODEL = "small"  # tiny, base, small, medium, large
WHISPER_DEVICE = "auto"  # cpu, cuda, auto
WHISPER_COMPUTE_TYPE = "int8"  # int8, float16, float32
```

**Model comparison:**
- `tiny`: Fastest, lowest accuracy (~1GB RAM)
- `base`: Fast, decent accuracy (~1GB RAM)
- `small`: Balanced (recommended) (~2GB RAM)
- `medium`: Slower, better accuracy (~5GB RAM)
- `large`: Slowest, best accuracy (~10GB RAM)

### Video Settings

```python
VIDEO_QUALITY = "1080p"  # 1080p, 720p, 480p, best
```

### Clip Settings

```python
MIN_CLIP_DURATION = 15  # Minimum clip length in seconds
MAX_CLIP_DURATION = 60  # Maximum clip length in seconds
CLIP_PADDING_BEFORE = 0.5  # Seconds to add before clip start
CLIP_PADDING_AFTER = 0.5  # Seconds to add after clip end
```

### Viral Analysis Settings

```python
MAX_CLIPS_PER_VIDEO = 5  # Maximum number of clips to create per video
MIN_VIRAL_SCORE = 7.0  # Minimum score (0-10) for a clip to be created
```

### Active Criteria

```python
ACTIVE_CRITERIA = ['viral_hooks', 'emotional_peaks', 'value_bombs', 'humor_moments']
```

You can customize which criteria to use by editing this list.

## 🎯 Viral Criteria Explained

The AI analyzes videos based on four main criteria:

### 1. Viral Hooks
Attention-grabbing moments that make people stop scrolling:
- Bold statements or controversial opinions
- Curiosity-inducing questions
- Shocking facts or statistics
- Pattern interrupts

### 2. Emotional Peaks
High-intensity emotional moments:
- Excitement and enthusiasm
- Inspiration and motivation
- Surprise and awe
- Relatable struggles and triumphs

### 3. Value Bombs
Concentrated actionable insights:
- Specific tactical advice
- Key insights or realizations
- Tools and resources
- Frameworks and systems

### 4. Humor Moments
Genuinely funny and entertaining segments:
- Self-deprecating humor
- Relatable situations
- Witty observations
- Funny anecdotes

## 📊 How It Works

```
Input: YouTube URL(s)
  ↓
1. Download Video (yt-dlp)
  ↓
2. Extract & Transcribe Audio (Whisper AI)
  ↓
3. Analyze with GPT-4 (Viral Criteria)
  ↓
4. Identify Top Segments (Scoring & Ranking)
  ↓
5. Slice Video Clips (ffmpeg)
  ↓
Output: Ready-to-post clips + metadata
```

## 📁 Output Structure

```
output/
├── Video_Title_1/
│   ├── Video_Title_1_clip01.mp4
│   ├── Video_Title_1_clip01_metadata.json
│   ├── Video_Title_1_clip02.mp4
│   └── Video_Title_1_clip02_metadata.json
└── Video_Title_2/
    ├── Video_Title_2_clip01.mp4
    └── Video_Title_2_clip01_metadata.json
```

### Metadata File Example

```json
{
  "clip_filename": "Video_Title_clip01.mp4",
  "source_video": "/path/to/source.mp4",
  "start_time": "02:15",
  "end_time": "02:45",
  "duration_seconds": 30,
  "viral_score": 8.5,
  "criteria_matched": ["viral_hooks", "value_bombs"],
  "reasoning": "Strong opening hook with actionable advice...",
  "suggested_title": "The One Thing Nobody Tells You About Success"
}
```

## 🎨 Customizing Criteria

You can customize the viral criteria by editing files in the `criteria/` directory:

- `viral_hooks.txt` - Define what makes a good hook
- `emotional_peaks.txt` - Emotional triggers to look for
- `value_bombs.txt` - Types of valuable content
- `humor_moments.txt` - What makes content funny

Each file contains instructions that GPT-4 uses to analyze videos. Edit these to match your content style and audience!

## 💡 Tips for Best Results

1. **Choose the right videos**: Longer videos (10+ minutes) typically yield more clips
2. **Adjust viral score threshold**: Lower `MIN_VIRAL_SCORE` for more clips, raise it for only the best
3. **Customize criteria**: Edit criteria files to match your niche and audience
4. **Experiment with models**: Try different OpenAI models to balance cost and quality
5. **Review metadata**: Check the JSON files to understand why clips were selected

## 🔧 Troubleshooting

### "Error: OPENAI_API_KEY not set"
Create a `.env` file in the project root with your OpenAI API key:
```bash
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

### "Error: ffmpeg not found"
Install ffmpeg using the instructions in the Requirements section.

### "No viral segments identified"
- Try lowering `MIN_VIRAL_SCORE` in config.py
- Check that your criteria files exist and have content
- Ensure the video has transcribable audio
- Try a longer video with more varied content

### High memory usage
- Use a smaller Whisper model (e.g., "tiny" or "base")
- Use `WHISPER_COMPUTE_TYPE = "int8"`
- Process fewer videos at once

### Slow processing
- Use "small" or "tiny" Whisper model
- Use GPU if available (`WHISPER_DEVICE = "cuda"`)
- Use lower video quality for testing
- Consider using gpt-3.5-turbo for faster (but less accurate) analysis

## 📊 Cost Estimation

**OpenAI API Costs** (approximate):
- 10-minute video ≈ $0.10-0.30 (depending on model and transcript length)
- GPT-4-turbo is recommended for best results
- GPT-3.5-turbo is cheaper but less accurate at identifying viral moments

**Tip**: Start with 1-2 videos to test before batch processing.

## 🚦 Limitations

- Requires active internet connection
- OpenAI API costs apply
- Processing time depends on video length (typically 2-5 minutes per video)
- Some videos may have download restrictions
- Accuracy depends on audio quality and GPT-4 analysis

## 🔐 Privacy & Safety

- Videos and audio are downloaded to your local `temp/` directory
- Transcripts are sent to OpenAI API for analysis
- No data is stored on external servers (except OpenAI processing)
- Temporary files are automatically cleaned up after processing

## 📝 Example Workflow

```bash
# 1. Setup
echo "OPENAI_API_KEY=sk-..." > .env
source venv/bin/activate

# 2. Add videos
echo "https://www.youtube.com/watch?v=example" >> videos.txt

# 3. Configure (optional)
nano src/config.py  # Adjust settings

# 4. Run
cd src
python main.py

# 5. Review clips
ls -la ../output/
```

## 🤝 Contributing

This is an open-source project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your success stories!

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

- [OpenAI](https://openai.com/) - GPT-4 for viral analysis
- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition
- [faster-whisper](https://github.com/guillaumekln/faster-whisper) - Optimized Whisper
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloader
- [FFmpeg](https://ffmpeg.org/) - Video processing

## 🎉 Success Stories

Share how you're using YouTube Viral Clipper! Tag us or submit a PR to add your story here.

---

**Made with ❤️ for content creators**

Need help? Open an issue or check the troubleshooting section above.

