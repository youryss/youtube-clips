#!/usr/bin/env python3
"""
Test script to check if get_video_info works locally
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))

from services.video_download_service import VideoDownloadService

# Test with the same video that's failing on server
test_url = "https://www.youtube.com/watch?v=FaoohSLIrt4"

print(f"Testing get_video_info with URL: {test_url}")
print("=" * 60)

try:
    info = VideoDownloadService.get_video_info(test_url)
    
    if info:
        print("✅ SUCCESS! Video info retrieved:")
        print(f"  Title: {info.get('title', 'N/A')}")
        print(f"  Duration: {info.get('duration', 0)} seconds")
        print(f"  ID: {info.get('id', 'N/A')}")
        print(f"  Uploader: {info.get('uploader', 'N/A')}")
        print(f"  Views: {info.get('view_count', 0)}")
    else:
        print("❌ FAILED: get_video_info returned None")
        
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

