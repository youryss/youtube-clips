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
        
        # Common browser names that yt-dlp supports
        browser_names = ['chrome', 'firefox', 'edge', 'opera', 'safari', 'vivaldi', 'brave']
        
        # Check if it's a browser name (case-insensitive)
        if cookies_value.lower() in browser_names:
            opts['cookiesfrombrowser'] = (cookies_value.lower(),)
        else:
            # Treat as file path
            cookies_path = Path(cookies_value)
            # If it's an absolute path or exists, use it as-is
            if cookies_path.is_absolute() or cookies_path.exists():
                opts['cookiefile'] = str(cookies_path)
            else:
                # Try relative to project root
                project_root = cli_config.PROJECT_ROOT
                full_path = project_root / cookies_path
                if full_path.exists():
                    opts['cookiefile'] = str(full_path)
                else:
                    # Last resort: use as-is (might be a path inside container)
                    opts['cookiefile'] = cookies_value
    
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
    })
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
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
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', '')
            
            # Look for file with matching title
            output_dir = Path(output_dir)
            for video_file in output_dir.glob('*.mp4'):
                if title in video_file.stem:
                    return str(video_file)
        
        return None
    
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
    })
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
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
    except Exception as e:
        print(f"Error getting video info: {e}")
        return None

