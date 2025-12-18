#!/usr/bin/env python3
"""
YouTube Downloader Utilities
Shared utilities for yt-dlp operations including cookie handling
"""

from pathlib import Path
from typing import Dict, Optional
from contextlib import nullcontext
import yt_dlp

from .processing_config import YT_DLP_COOKIES, PROJECT_ROOT


def _make_readonly_cookiejar(cookiejar):
    """Make a cookie jar read-only by monkey-patching the save and open methods"""
    if cookiejar:
        # Patch the save method
        if hasattr(cookiejar, 'save'):
            def noop_save(filename=None, ignore_discard=False, ignore_expires=False):
                """Override save to do nothing - file is read-only"""
                pass
            cookiejar.save = noop_save
        
        # Also patch the open method to prevent write attempts
        if hasattr(cookiejar, 'open'):
            original_open = cookiejar.open
            def readonly_open(file, write=False, *args, **kwargs):
                """Override open to prevent write operations on read-only file"""
                if write:
                    return nullcontext()
                else:
                    return original_open(file, write=False, *args, **kwargs)
            cookiejar.open = readonly_open
    
    return cookiejar


def disable_cookie_saving(ydl):
    """Disable cookie saving on yt-dlp instance to prevent read-only errors"""
    # Patch the cookiejar (save and open methods)
    if hasattr(ydl, 'cookiejar') and ydl.cookiejar:
        _make_readonly_cookiejar(ydl.cookiejar)
    
    # Also patch save_cookies() method on the YoutubeDL instance itself
    if hasattr(ydl, 'save_cookies'):
        def noop_save_cookies():
            """Override save_cookies to do nothing - file is read-only"""
            pass
        ydl.save_cookies = noop_save_cookies
    
    # Patch close() method to prevent cookie saving on exit
    if hasattr(ydl, 'close'):
        original_close = ydl.close
        def safe_close():
            """Override close to skip cookie saving"""
            try:
                original_close()
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    pass
                else:
                    raise
        ydl.close = safe_close
    
    # Also patch __exit__ for context manager support
    if hasattr(ydl, '__exit__'):
        original_exit = ydl.__exit__
        def safe_exit(exc_type, exc_val, exc_tb):
            """Override __exit__ to handle cookie save errors"""
            try:
                return original_exit(exc_type, exc_val, exc_tb)
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    return False
                else:
                    raise
        ydl.__exit__ = safe_exit
    
    return ydl


def get_ytdlp_cookie_opts() -> Dict:
    """
    Get yt-dlp cookie options based on configuration
    
    Returns:
        Dictionary of yt-dlp options with cookie configuration
    """
    opts = {}
    
    if not YT_DLP_COOKIES:
        return opts
    
    cookies_value = YT_DLP_COOKIES.strip()
    
    # Common browser names that yt-dlp supports
    browser_names = ['chrome', 'firefox', 'edge', 'opera', 'safari', 'vivaldi', 'brave']
    
    # Check if it's a browser name (case-insensitive)
    if cookies_value.lower() in browser_names:
        opts['cookiesfrombrowser'] = (cookies_value.lower(),)
        return opts
    
    # Treat as file path
    cookies_path = Path(cookies_value)
    cookie_file = None
    
    # If it's an absolute path, use it as-is
    if cookies_path.is_absolute():
        if cookies_path.exists():
            cookie_file = str(cookies_path)
        else:
            # Try as container path (e.g., /app/cookies.txt)
            cookie_file = cookies_value
    # Check if relative path exists
    elif cookies_path.exists():
        cookie_file = str(cookies_path)
    else:
        # Try relative to project root
        full_path = PROJECT_ROOT / cookies_path
        if full_path.exists():
            cookie_file = str(full_path)
        else:
            # Last resort: use as-is (might be a path inside container)
            cookie_file = cookies_value
    
    if cookie_file:
        opts['cookiefile'] = cookie_file
    
    return opts


def create_ytdlp_instance(base_opts: Optional[Dict] = None) -> yt_dlp.YoutubeDL:
    """
    Create a yt-dlp instance with cookie support and read-only protection
    
    Args:
        base_opts: Base options dictionary
    
    Returns:
        Configured yt-dlp instance
    """
    opts = base_opts or {}
    
    # Add cookie options
    cookie_opts = get_ytdlp_cookie_opts()
    opts.update(cookie_opts)
    
    # Create instance
    ydl = yt_dlp.YoutubeDL(opts)
    
    # Disable cookie saving
    disable_cookie_saving(ydl)
    
    return ydl

