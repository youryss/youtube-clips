#!/usr/bin/env python3
"""
Video Download Module
Downloads full YouTube videos with caching support
"""

import os
from pathlib import Path
from typing import Optional, Dict
import yt_dlp
from . import config as cli_config


def _make_readonly_cookiejar(cookiejar):
    """Make a cookie jar read-only by monkey-patching the save and open methods"""
    if cookiejar:
        # Patch the save method
        if hasattr(cookiejar, 'save'):
            def noop_save(filename=None, ignore_discard=False, ignore_expires=False):
                """Override save to do nothing - file is read-only"""
                pass  # Don't save cookies, file is read-only
            cookiejar.save = noop_save
        
        # Also patch the open method to prevent write attempts
        if hasattr(cookiejar, 'open'):
            original_open = cookiejar.open
            def readonly_open(file, write=False, *args, **kwargs):
                """Override open to prevent write operations on read-only file"""
                if write:
                    # If trying to write, just return a no-op context manager
                    from contextlib import nullcontext
                    return nullcontext()
                else:
                    # For read operations, use the original method
                    return original_open(file, write=False, *args, **kwargs)
            cookiejar.open = readonly_open
    
    return cookiejar


def _disable_cookie_saving(ydl):
    """Disable cookie saving on yt-dlp instance to prevent read-only errors"""
    # Patch the cookiejar (save and open methods)
    if hasattr(ydl, 'cookiejar') and ydl.cookiejar:
        _make_readonly_cookiejar(ydl.cookiejar)
    
    # Also patch save_cookies() method on the YoutubeDL instance itself
    if hasattr(ydl, 'save_cookies'):
        def noop_save_cookies():
            """Override save_cookies to do nothing - file is read-only"""
            pass  # Don't save cookies, file is read-only
        ydl.save_cookies = noop_save_cookies
    
    # Patch close() method to prevent cookie saving on exit
    if hasattr(ydl, 'close'):
        original_close = ydl.close
        def safe_close():
            """Override close to skip cookie saving"""
            try:
                # Call original close but catch cookie save errors
                original_close()
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    # Expected error, ignore it
                    pass
                else:
                    raise
        ydl.close = safe_close
    
    # Also patch __exit__ for context manager support (with statements)
    if hasattr(ydl, '__exit__'):
        original_exit = ydl.__exit__
        def safe_exit(exc_type, exc_val, exc_tb):
            """Override __exit__ to handle cookie save errors"""
            try:
                return original_exit(exc_type, exc_val, exc_tb)
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    # Expected error, ignore it and return False to suppress
                    return False
                else:
                    raise
        ydl.__exit__ = safe_exit
    
    return ydl


def _get_ytdlp_base_opts() -> Dict:
    """
    Get base yt-dlp options with cookie support if configured
    
    Returns:
        Dictionary of yt-dlp options
    """
    opts = {}
    
    # Add cookie support if configured
    if cli_config.YT_DLP_COOKIES:
        cookies_value = cli_config.YT_DLP_COOKIES.strip()
        print(f"[yt-dlp] Cookie config found: {cookies_value}")
        
        # Common browser names that yt-dlp supports
        browser_names = ['chrome', 'firefox', 'edge', 'opera', 'safari', 'vivaldi', 'brave']
        
        # Check if it's a browser name (case-insensitive)
        if cookies_value.lower() in browser_names:
            opts['cookiesfrombrowser'] = (cookies_value.lower(),)
            print(f"[yt-dlp] Using cookies from browser: {cookies_value.lower()}")
        else:
            # Treat as file path
            cookies_path = Path(cookies_value)
            cookie_file = None
            
            # If it's an absolute path, use it as-is
            if cookies_path.is_absolute():
                if cookies_path.exists():
                    cookie_file = str(cookies_path)
                    print(f"[yt-dlp] Using absolute cookie file: {cookie_file}")
                else:
                    print(f"[yt-dlp] WARNING: Cookie file not found at absolute path: {cookies_path}")
            # Check if relative path exists
            elif cookies_path.exists():
                cookie_file = str(cookies_path)
                print(f"[yt-dlp] Using relative cookie file: {cookie_file}")
            else:
                # Try relative to project root
                project_root = cli_config.PROJECT_ROOT
                full_path = project_root / cookies_path
                if full_path.exists():
                    cookie_file = str(full_path)
                    print(f"[yt-dlp] Using cookie file from project root: {cookie_file}")
                else:
                    # Last resort: use as-is (might be a path inside container)
                    cookie_file = cookies_value
                    print(f"[yt-dlp] Using cookie path as-is (container path): {cookie_file}")
            
            if cookie_file:
                opts['cookiefile'] = cookie_file
                # Prevent yt-dlp from trying to save cookies (file is read-only)
                # We'll use a custom cookiejar that doesn't save on close
                opts['cookiesfrombrowser'] = None  # Ensure we're not using browser cookies
                # Verify file exists if it's a real path
                if Path(cookie_file).exists():
                    file_size = Path(cookie_file).stat().st_size
                    print(f"[yt-dlp] Cookie file verified: {cookie_file} ({file_size} bytes)")
                    # Check if file has YouTube cookies
                    try:
                        with open(cookie_file, 'r') as f:
                            content = f.read()
                            if 'youtube.com' in content or '.youtube.com' in content:
                                print(f"[yt-dlp] YouTube cookies found in file")
                            else:
                                print(f"[yt-dlp] WARNING: No YouTube cookies found in file")
                    except:
                        pass
                else:
                    print(f"[yt-dlp] WARNING: Cookie file does not exist: {cookie_file}")
    else:
        print("[yt-dlp] No cookie configuration found (YT_DLP_COOKIES not set)")
    
    return opts


def download_video(
    url: str,
    output_dir: str,
    quality: str = "1080p",
    filename: Optional[str] = None,
    progress_callback: Optional[callable] = None
) -> Optional[Dict[str, any]]:
    """
    Download full video from YouTube
    
    Args:
        url: YouTube video URL
        output_dir: Directory to save video
        quality: Video quality (1080p, 720p, 480p, best)
        filename: Optional custom filename (without extension)
    
    Returns:
        Dictionary with:
        {
            'path': str (full path to video file),
            'title': str,
            'duration': float (seconds),
            'resolution': str,
            'format': str (mp4, webm, etc.)
        }
        Returns None if download fails
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Quality format mapping
    quality_formats = {
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        'best': 'bestvideo+bestaudio/best'
    }
    
    format_str = quality_formats.get(quality, quality_formats['best'])
    
    # Set output template
    if filename:
        output_template = str(output_dir / filename)
    else:
        output_template = str(output_dir / '%(title)s.%(ext)s')
    
    def progress_hook(d):
        """Progress hook for download"""
        if progress_callback and d['status'] == 'downloading':
            if 'downloaded_bytes' in d and 'total_bytes' in d:
                percent = (d['downloaded_bytes'] / d['total_bytes']) * 100
                progress_callback(percent)
            elif 'downloaded_bytes' in d and 'total_bytes_estimate' in d:
                percent = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
                progress_callback(percent)
    
    ydl_opts = _get_ytdlp_base_opts()
    ydl_opts.update({
        'format': format_str,
        'outtmpl': output_template,
        'merge_output_format': 'mp4',
        'quiet': False,
        'no_warnings': False,
        'progress_hooks': [progress_hook] if progress_callback else [],
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
        # Add user agent to appear more like a browser
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.youtube.com/',
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
            }
        },
        # Fallback format if requested format isn't available
        'format_sort': ['res', 'ext:mp4:m4a', 'codec:h264', 'acodec:aac'],
    })
    # Prevent yt-dlp from trying to save cookies (file is read-only)
    # We'll catch the error if it tries
    
    try:
        # Create yt-dlp instance
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        # Disable cookie saving to prevent read-only file system errors
        _disable_cookie_saving(ydl)
        try:
            # Extract info first
            info = ydl.extract_info(url, download=False)
            
            # Check if video already exists
            if filename:
                expected_path = output_dir / f"{filename}.mp4"
            else:
                sanitized_title = info['title'].replace('/', '_').replace('\\', '_')
                expected_path = output_dir / f"{sanitized_title}.mp4"
            
            if expected_path.exists():
                print(f"Video already exists: {expected_path.name}")
                return {
                    'path': str(expected_path),
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'resolution': f"{info.get('height', 0)}p",
                    'format': 'mp4',
                    'cached': True
                }
            
            # Download video
            print(f"Downloading: {info['title']}")
            ydl.download([url])
            
            # Find the downloaded file
            if expected_path.exists():
                video_path = expected_path
            else:
                # Fallback: find most recent video file
                video_files = sorted(
                    output_dir.glob('*.mp4'),
                    key=lambda p: p.stat().st_mtime,
                    reverse=True
                )
                if video_files:
                    video_path = video_files[0]
                else:
                    return None
            
            return {
                'path': str(video_path),
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'resolution': f"{info.get('height', 0)}p",
                'format': 'mp4',
                'cached': False
            }
        finally:
            # Close yt-dlp (cookie saving is prevented by ReadOnlyCookieJar)
            try:
                ydl.close()
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    # Expected error - cookies file is read-only, ignore it
                    pass
                else:
                    raise
    
    except Exception as e:
        print(f"Error downloading video: {e}")
        return None


def check_video_exists(url: str, output_dir: str) -> Optional[str]:
    """
    Check if video from URL is already downloaded
    
    Args:
        url: YouTube video URL
        output_dir: Directory where videos are stored
    
    Returns:
        Path to existing video file, or None if not found
    """
    try:
        ydl_opts = _get_ytdlp_base_opts()
        ydl_opts.update({
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        })
        
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        # Disable cookie saving to prevent read-only file system errors
        _disable_cookie_saving(ydl)
        try:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', '')
            
            # Look for file with matching title
            output_dir = Path(output_dir)
            for video_file in output_dir.glob('*.mp4'):
                if title in video_file.stem:
                    return str(video_file)
            
            return None
        finally:
            # Close yt-dlp (cookie saving is prevented)
            try:
                ydl.close()
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    pass  # Expected error, ignore
                else:
                    raise
    
    except Exception:
        return None


def get_video_info(url: str) -> Optional[Dict[str, any]]:
    """
    Get video information without downloading
    
    Args:
        url: YouTube video URL
    
    Returns:
        Dictionary with video metadata
    """
    ydl_opts = _get_ytdlp_base_opts()
    ydl_opts.update({
        'quiet': True,
        'no_warnings': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.youtube.com/',
        # Use flexible format selection for info extraction
        # This ensures yt-dlp can always find a suitable format
        'format': 'best/bestvideo+bestaudio/bestvideo/bestaudio/worst',
        'skip_download': True,  # We're not downloading, just getting info
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
            }
        },
    })
    
    try:
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        # Disable cookie saving to prevent read-only file system errors
        _disable_cookie_saving(ydl)
        try:
            info = ydl.extract_info(url, download=False)
            return {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'url': url,
                'id': info.get('id', ''),
                'description': info.get('description', ''),
                'uploader': info.get('uploader', ''),
                'view_count': info.get('view_count', 0),
            }
        finally:
            # Close yt-dlp (cookie saving is prevented)
            try:
                ydl.close()
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    pass  # Expected error, ignore
                else:
                    raise
    except Exception as e:
        print(f"Error getting video info: {e}")
        return None

