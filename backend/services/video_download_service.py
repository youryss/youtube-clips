#!/usr/bin/env python3
"""
Video Download Service
Service for downloading YouTube videos
"""

import os
import random
from pathlib import Path
from typing import Optional, Dict, Callable
import yt_dlp

from .processing_config import VIDEO_QUALITY, TEMP_PATH, YT_DLP_COOKIES
from .ytdlp_utils import create_ytdlp_instance, disable_cookie_saving


class VideoDownloadService:
    """Service for downloading YouTube videos"""
    
    @staticmethod
    def download_video(
        url: str,
        output_dir: Optional[str] = None,
        quality: Optional[str] = None,
        filename: Optional[str] = None,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Optional[Dict]:
        """
        Download a YouTube video
        
        Args:
            url: YouTube video URL
            output_dir: Directory to save video (defaults to TEMP_PATH)
            quality: Video quality (defaults to VIDEO_QUALITY)
            filename: Optional custom filename
            progress_callback: Optional callback for progress updates
        
        Returns:
            Dictionary with video info or None if failed
        """
        output_dir = Path(output_dir or TEMP_PATH)
        output_dir.mkdir(parents=True, exist_ok=True)
        quality = quality or VIDEO_QUALITY
        
        # Quality format mapping with fallbacks
        # Try simpler formats first (they work better with YouTube restrictions)
        # Then fall back to more specific formats
        quality_formats = {
            '1080p': [
                'best',  # Try best first - most reliable
                'bestvideo+bestaudio/best',
                'best[height<=1080]',
                'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
                'bestvideo[height<=1080]+bestaudio',
                'bestaudio/best',  # Audio fallback if video formats blocked
            ],
            '720p': [
                'best',  # Try best first
                'bestvideo+bestaudio/best',
                'best[height<=720]',
                'bestvideo[height<=720]+bestaudio/best[height<=720]',
                'bestvideo[height<=720]+bestaudio',
                'bestaudio/best',
            ],
            '480p': [
                'best',  # Try best first
                'bestvideo+bestaudio/best',
                'best[height<=480]',
                'bestvideo[height<=480]+bestaudio/best[height<=480]',
                'bestvideo[height<=480]+bestaudio',
                'bestaudio/best',
            ],
            'best': [
                'best',  # Most permissive - try first
                'bestvideo+bestaudio/best',
                'bestvideo+bestaudio',
                'bestaudio/best',  # Audio fallback
            ]
        }
        
        format_options = quality_formats.get(quality, quality_formats['best'])
        
        # Set output template
        if filename:
            output_template = str(output_dir / filename)
        else:
            output_template = str(output_dir / '%(title)s.%(ext)s')
        
        def progress_hook(d):
            """Progress hook for download"""
            if progress_callback and d.get('status') == 'downloading':
                if 'downloaded_bytes' in d and 'total_bytes' in d:
                    percent = (d['downloaded_bytes'] / d['total_bytes']) * 100
                    progress_callback(percent)
                elif 'downloaded_bytes' in d and 'total_bytes_estimate' in d:
                    percent = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
                    progress_callback(percent)
        
        # Base options for download (format will be set per strategy)
        base_opts_template = {
            'outtmpl': output_template,
            'merge_output_format': 'mp4',
            'quiet': False,
            'no_warnings': False,
            'progress_hooks': [progress_hook] if progress_callback else [],
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': 'https://www.youtube.com/',
            'format_sort': ['res', 'ext:mp4:m4a', 'codec:h264', 'acodec:aac'],
        }
        
        # Build strategies: try each format option with and without cookies
        strategies = []
        
        # Get cookie file if configured
        cookie_file = None
        if YT_DLP_COOKIES:
            cookies_value = YT_DLP_COOKIES.strip()
            if cookies_value and cookies_value.lower() not in ['chrome', 'firefox', 'edge', 'opera', 'safari', 'vivaldi', 'brave']:
                cookie_path = Path(cookies_value)
                if cookie_path.is_absolute() and cookie_path.exists():
                    cookie_file = str(cookie_path)
                elif cookie_path.exists():
                    cookie_file = str(cookie_path)
                else:
                    cookie_file = cookies_value
        
        # Create strategies: try each format option
        # Prioritize: best format with cookies first (most reliable)
        for format_str in format_options:
            # Try with cookies first (if available) - this is most reliable
            # For 'best' format, don't specify extractor_args (let yt-dlp choose)
            if cookie_file:
                if format_str == 'best':
                    # Simplest strategy - just cookies and best format
                    opts = {
                        **base_opts_template,
                        'format': format_str,
                        'cookiefile': cookie_file,
                    }
                    strategies.append(opts)
                else:
                    # For other formats, try with web client
                    opts = {
                        **base_opts_template,
                        'format': format_str,
                        'cookiefile': cookie_file,
                        'extractor_args': {
                            'youtube': {
                                'player_client': ['web'],
                            }
                        },
                    }
                    strategies.append(opts)
            
            # Try without cookies, but only for simpler formats to avoid too many strategies
            # Skip complex format selectors without cookies (they usually fail)
            if format_str in ['best', 'bestaudio/best']:
                for client_list in [['web'], ['ios']]:
                    opts = {
                        **base_opts_template,
                        'format': format_str,
                        'extractor_args': {
                            'youtube': {
                                'player_client': client_list,
                            }
                        },
                    }
                    strategies.append(opts)
        
        # Try each strategy
        last_error = None
        for i, ydl_opts in enumerate(strategies):
            try:
                # For 'best' format with cookies, use direct yt-dlp (most reliable)
                # For other formats, use create_ytdlp_instance
                format_str = ydl_opts.get('format', '')
                has_cookies = 'cookiefile' in ydl_opts
                
                if format_str == 'best' and has_cookies:
                    # Direct yt-dlp for best format with cookies (most reliable)
                    ydl = yt_dlp.YoutubeDL(ydl_opts)
                else:
                    # Use create_ytdlp_instance for other strategies
                    ydl = create_ytdlp_instance(ydl_opts)
                
                try:
                    # Extract info first
                    info = ydl.extract_info(url, download=False)
                    
                    if not info or not info.get('title'):
                        raise Exception("Failed to extract video info")
                    
                    # Check if video already exists
                    if filename:
                        expected_path = output_dir / f"{filename}.mp4"
                    else:
                        sanitized_title = info['title'].replace('/', '_').replace('\\', '_')
                        expected_path = output_dir / f"{sanitized_title}.mp4"
                    
                    if expected_path.exists():
                        return {
                            'path': str(expected_path),
                            'title': info.get('title', 'Unknown'),
                            'duration': info.get('duration', 0),
                            'resolution': f"{info.get('height', 0)}p",
                            'format': 'mp4',
                            'cached': True
                        }
                    
                    # Track files that exist BEFORE download to find newly created files
                    import time
                    download_start_time = time.time()
                    existing_files = {f.name: f.stat().st_mtime for f in output_dir.glob('*.mp4')}
                    # Also track files without extension (yt-dlp might download without extension first)
                    existing_files_no_ext = {f.name: f.stat().st_mtime for f in output_dir.glob('*') if f.is_file() and not f.suffix}
                    
                    # Download video
                    ydl.download([url])
                    
                    # CRITICAL: If download succeeded, we MUST find the file and return it
                    # Don't let file detection failures cause us to try other strategies
                    # Wrap file detection in try-except to handle it separately
                    try:
                        # Find the downloaded file
                        if expected_path.exists():
                            video_path = expected_path
                        else:
                            # CRITICAL FIX: Only consider files created DURING this download
                            # Find files that are NEW (created after download started) or modified during download
                            current_time = time.time()
                        # Only include files that:
                        # 1. Didn't exist before download (truly new), OR
                        # 2. Were modified AFTER download started (modified during download)
                        new_files = []
                        all_files = list(output_dir.glob('*.mp4'))
                        # Also check for files without extension (yt-dlp might download without .mp4 first)
                        all_files_no_ext = [f for f in output_dir.glob('*') if f.is_file() and not f.suffix and f.name not in existing_files_no_ext]
                        for f in all_files:
                            file_mtime = f.stat().st_mtime
                            is_new = f.name not in existing_files
                            was_modified_during_download = f.name in existing_files and file_mtime >= download_start_time
                            if is_new or was_modified_during_download:
                                new_files.append(f)
                        
                        # Check if any file without extension matches expected name
                        expected_name_no_ext = expected_path.stem
                        matching_no_ext = [f for f in all_files_no_ext if f.name == expected_name_no_ext or f.name.startswith(expected_name_no_ext)]
                        if matching_no_ext:
                            # File exists without extension - wait a moment for yt-dlp to add extension, or use it as-is
                            most_recent_no_ext = max(matching_no_ext, key=lambda p: p.stat().st_mtime)
                            # Check if .mp4 version exists now
                            potential_mp4 = output_dir / f"{most_recent_no_ext.name}.mp4"
                            if potential_mp4.exists():
                                new_files.append(potential_mp4)
                            elif most_recent_no_ext.stat().st_mtime >= download_start_time:
                                # File was created during download, use it even without extension
                                new_files.append(most_recent_no_ext)
                        
                        # If no new files, check if download actually created a file with different name
                        # yt-dlp might have saved it with a different name, so check most recent files
                        if not new_files:
                            # Check if there are any files at all, and use the most recent one as last resort
                            if all_files:
                                most_recent = max(all_files, key=lambda p: p.stat().st_mtime)
                                file_age = current_time - most_recent.stat().st_mtime
                                # If file was created/modified very recently (within last 30 seconds), use it
                                if file_age < 30:
                                    print(f"WARNING: No new files detected, but using recently modified file: {most_recent.name} (age: {file_age:.1f}s)")
                                    video_path = most_recent
                                else:
                                    raise Exception(f"Downloaded file not found. Expected: {expected_path.name}. No new files created during download. Most recent file is {file_age:.1f} seconds old.")
                            else:
                                raise Exception(f"Downloaded file not found. Expected: {expected_path.name}. No files in output directory.")
                        else:
                            # First, try to match by filename pattern
                            expected_name_base = expected_path.stem
                            matching_files = [
                                f for f in new_files
                                if f.stem == expected_name_base or f.stem.startswith(expected_name_base) or expected_name_base.startswith(f.stem.split('_')[0] if '_' in f.stem else f.stem)
                            ]
                            
                            if matching_files:
                                # Use the most recent matching file
                                video_path = max(matching_files, key=lambda p: p.stat().st_mtime)
                            else:
                                # If no pattern match, use the most recently created NEW file
                                # This ensures we don't pick up old files from previous jobs
                                video_path = max(new_files, key=lambda p: p.stat().st_mtime)
                                print(f"WARNING: Expected file pattern not found, using newly created file: {video_path.name}")
                                print(f"  Expected: {expected_path.name}")
                                print(f"  Selected: {video_path.name}")
                        
                        return {
                            'path': str(video_path),
                            'title': info.get('title', 'Unknown'),
                            'duration': info.get('duration', 0),
                            'resolution': f"{info.get('height', 0)}p",
                            'format': 'mp4',
                            'cached': False
                        }
                    except Exception as file_detection_error:
                        # Download succeeded but file detection failed - don't continue to other strategies
                        # Re-raise with a specific message that won't trigger "continue to next strategy"
                        error_msg = str(file_detection_error)
                        raise Exception(f"Download succeeded but file not found: {error_msg}") from file_detection_error
                finally:
                    try:
                        ydl.close()
                    except OSError:
                        pass
                        
            except Exception as e:
                error_msg = str(e)
                last_error = e
                
                # Continue to next strategy ONLY for format-related errors
                # Do NOT continue if download succeeded but file detection failed
                if 'Download succeeded but file not found' in error_msg:
                    # This means download worked but we can't find the file - don't try other strategies
                    raise
                
                # Continue to next strategy for format-related errors
                # Also handle "Only images" error which means YouTube is blocking
                if any(phrase in error_msg for phrase in [
                    'Requested format is not available',
                    'Only images are available',
                    'challenge solving failed'
                ]):
                    if i < len(strategies) - 1:
                        continue
                else:
                    # For other errors, also try next strategy
                    if i < len(strategies) - 1:
                        continue
        
        if last_error:
            print(f"Error downloading video after {len(strategies)} strategies: {str(last_error)[:200]}")
        return None
    
    @staticmethod
    def get_video_info(url: str) -> Optional[Dict]:
        """
        Get video information without downloading
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dictionary with video metadata or None if failed
        """
        # Simple approach: Try flat extraction first (most reliable, no format validation)
        # This is the same pattern that works in direct testing
        try:
            opts = {
                'quiet': True,
                'no_warnings': True,
                'skip_download': True,
                'extract_flat': True,
                'noplaylist': True,
            }
            ydl = yt_dlp.YoutubeDL(opts)
            info = ydl.extract_info(url, download=False)
            ydl.close()
            
            # Handle both dict (normal) and list (playlist) responses
            if isinstance(info, list) and len(info) > 0:
                info = info[0]
            
            if info and isinstance(info, dict):
                title = info.get('title')
                if title:
                    return {
                        'title': title,
                        'duration': info.get('duration', 0),
                        'url': url,
                        'id': info.get('id', ''),
                        'description': info.get('description', ''),
                        'uploader': info.get('uploader', ''),
                        'view_count': info.get('view_count', 0),
                    }
        except Exception as e:
            # Silently continue to fallback strategies
            pass
        
        # Fallback: Try with cookies and different clients if flat extraction failed
        strategies = []
        
        # Add proxy if configured
        proxy = os.getenv('YT_DLP_PROXY')
        base_proxy = {'proxy': proxy} if proxy else {}
        
        # Try with cookies if configured
        if YT_DLP_COOKIES:
            cookies_value = YT_DLP_COOKIES.strip()
            if cookies_value and cookies_value.lower() not in ['chrome', 'firefox', 'edge', 'opera', 'safari', 'vivaldi', 'brave']:
                cookie_path = Path(cookies_value)
                cookie_file = None
                if cookie_path.is_absolute() and cookie_path.exists():
                    cookie_file = str(cookie_path)
                elif cookie_path.exists():
                    cookie_file = str(cookie_path)
                else:
                    cookie_file = cookies_value
                
                if cookie_file:
                    strategies.append({
                        'quiet': True,
                        'no_warnings': True,
                        'skip_download': True,
                        'extract_flat': False,
                        'noplaylist': True,
                        'cookiefile': cookie_file,
                        'extractor_args': {
                            'youtube': {
                                'player_client': ['web'],
                            }
                        },
                        **base_proxy,
                    })
        
        # Try different clients without cookies
        for client in [['ios'], ['android'], ['mweb'], ['web']]:
            strategies.append({
                'quiet': True,
                'no_warnings': True,
                'skip_download': True,
                'extract_flat': False,
                'noplaylist': True,
                'extractor_args': {
                    'youtube': {
                        'player_client': client,
                    }
                },
                **base_proxy,
            })
        
        # Try fallback strategies
        last_error = None
        for i, ydl_opts in enumerate(strategies):
            try:
                ydl = create_ytdlp_instance(ydl_opts)
                try:
                    info = ydl.extract_info(url, download=False)
                    
                    if isinstance(info, list) and len(info) > 0:
                        info = info[0]
                    
                    if info and isinstance(info, dict) and info.get('title'):
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
                    try:
                        ydl.close()
                    except:
                        pass
            except Exception as e:
                last_error = e
                if i < len(strategies) - 1:
                    continue
        
        if last_error:
            print(f"Error getting video info: {str(last_error)[:200]}")
        return None
