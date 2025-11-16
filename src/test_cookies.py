#!/usr/bin/env python3
"""
Test script to verify cookie patches work correctly
Run this in the container to test: docker-compose exec backend python3 /app/src/test_cookies.py
"""

import sys
import os
from contextlib import nullcontext
import yt_dlp

# Copy the patch functions directly to avoid import issues
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

# Test with our patches
print("Testing yt-dlp with cookie patches...")
print("=" * 60)

opts = {
    'cookiefile': '/app/cookies.txt',
    'quiet': False,
    'no_warnings': False,
    'verbose': True
}

try:
    ydl = yt_dlp.YoutubeDL(opts)
    # Apply our patches
    _disable_cookie_saving(ydl)
    
    # Test extraction
    info = ydl.extract_info('https://www.youtube.com/watch?v=AVaXDAqkKAQ', download=False)
    print('\n✅ SUCCESS: Got video info')
    print(f'Title: {info.get("title", "N/A")}')
    
    # Test close (this is where the error used to happen)
    print('\nTesting close() method...')
    ydl.close()
    print('✅ SUCCESS: close() completed without errors')
    
    # Test with context manager (the problematic case)
    print('\nTesting with context manager...')
    ydl2 = yt_dlp.YoutubeDL(opts)
    _disable_cookie_saving(ydl2)
    with ydl2:
        info2 = ydl2.extract_info('https://www.youtube.com/watch?v=AVaXDAqkKAQ', download=False)
        print(f'✅ SUCCESS: Context manager test - Title: {info2.get("title", "N/A")}')
    
    print('\n' + '=' * 60)
    print('✅ ALL TESTS PASSED - Cookie patches are working!')
    
except Exception as e:
    print(f'\n❌ ERROR: {str(e)}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

