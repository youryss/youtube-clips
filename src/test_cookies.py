#!/usr/bin/env python3
"""
Test script to verify cookie patches work correctly
Run this in the container to test: docker-compose exec backend python3 -m src.test_cookies
Or: docker-compose exec backend python3 /app/src/test_cookies.py
"""

import sys
import os

# Set up path for imports - PYTHONPATH should already be /app in container
# But we'll ensure it's set correctly
if '/app' not in sys.path:
    sys.path.insert(0, '/app')

# Import as a module to handle relative imports
import importlib.util
spec = importlib.util.spec_from_file_location("download", "/app/src/download.py")
download_module = importlib.util.module_from_spec(spec)
sys.modules['download'] = download_module
spec.loader.exec_module(download_module)

# Now we can get the function
_disable_cookie_saving = download_module._disable_cookie_saving
import yt_dlp

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

