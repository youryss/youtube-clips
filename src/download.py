#!/usr/bin/env python3
"""
Video Download Module
Downloads full YouTube videos with caching support
"""

import os
from pathlib import Path
from typing import Optional, Dict
import yt_dlp


def download_video(
    url: str,
    output_dir: str,
    quality: str = "1080p",
    filename: Optional[str] = None
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
    
    ydl_opts = {
        'format': format_str,
        'outtmpl': output_template,
        'merge_output_format': 'mp4',
        'quiet': False,
        'no_warnings': False,
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
    }
    
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
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        }
        
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
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    
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

