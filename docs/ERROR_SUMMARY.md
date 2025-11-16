# Error Summary for GitHub Issue

## Error Message
```
ERROR: [youtube] <VIDEO_ID>: Requested format is not available. Use --list-formats for a list of available formats
```

## Context
- **yt-dlp version**: (check with `python3 -c "import yt_dlp; print(yt_dlp.__version__)"`)
- **Python version**: 3.11
- **OS**: Linux (Docker container)
- **Video tested**: `https://www.youtube.com/watch?v=FaoohSLIrt4` and `https://www.youtube.com/watch?v=Wtx3rb2ij8I`

## Configuration Used
```python
ydl_opts = {
    'quiet': True,
    'no_warnings': True,
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'referer': 'https://www.youtube.com/',
    'skip_download': True,
    'extract_flat': True,  # Tried both True and False
    'noplaylist': True,
    'ignoreerrors': False,
    'listformats': False,
    'cookiefile': '/app/cookies.txt',  # Cookies are configured
    'extractor_args': {
        'youtube': {
            'player_client': ['android', 'web'],
        }
    },
}
# No 'format' option specified
```

## What We Tried
1. ✅ Removed `format` option completely
2. ✅ Used `extract_flat=True` 
3. ✅ Used `extract_flat=False`
4. ✅ Added `listformats=False`
5. ✅ Removed `format_sort`
6. ✅ Created fresh opts dict (not using base opts)
7. ✅ Tested with and without cookies
8. ✅ Tested multiple videos (not video-specific)

## Expected Behavior
When using `extract_flat=True` and `skip_download=True` without specifying a format, yt-dlp should extract video metadata without requiring format selection.

## Actual Behavior
yt-dlp still tries to validate/select a format and fails with "Requested format is not available" error, even though we're only trying to get metadata.

## Code Snippet
```python
ydl = yt_dlp.YoutubeDL(ydl_opts)
_disable_cookie_saving(ydl)  # Custom function to prevent cookie saving
info = ydl.extract_info(url, download=False)  # Fails here
```

## Full Traceback
```
ERROR: [youtube] FaoohSLIrt4: Requested format is not available. Use --list-formats for a list of available formats
Traceback (most recent call last):
  File "/app/backend/services/processor.py", line 66, in process
    raise Exception("Failed to get video information")
Exception: Failed to get video information
```

