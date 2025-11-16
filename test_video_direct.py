#!/usr/bin/env python3
"""
Direct test script to upload and run on server
"""
import sys
sys.path.insert(0, '/app')
import yt_dlp

# Test URL
test_url = "https://www.youtube.com/watch?v=Wtx3rb2ij8I"

print("=" * 60)
print("Test 1: Without cookies, extract_flat=True")
print("=" * 60)
ydl_opts1 = {
    'quiet': False,
    'extract_flat': True,
    'skip_download': True,
    'noplaylist': True,
}

try:
    ydl1 = yt_dlp.YoutubeDL(ydl_opts1)
    info1 = ydl1.extract_info(test_url, download=False)
    if info1:
        print(f"✅ SUCCESS - Title: {info1.get('title', 'N/A')}")
    else:
        print("❌ FAILED - info is None")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("\n" + "=" * 60)
print("Test 2: With cookies, extract_flat=True")
print("=" * 60)
ydl_opts2 = {
    'quiet': False,
    'extract_flat': True,
    'skip_download': True,
    'noplaylist': True,
    'cookiefile': '/app/cookies.txt',
}

try:
    ydl2 = yt_dlp.YoutubeDL(ydl_opts2)
    info2 = ydl2.extract_info(test_url, download=False)
    if info2:
        print(f"✅ SUCCESS - Title: {info2.get('title', 'N/A')}")
    else:
        print("❌ FAILED - info is None")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("\n" + "=" * 60)
print("yt-dlp version:", yt_dlp.__version__)
print("=" * 60)

