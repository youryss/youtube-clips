#!/usr/bin/env python3
"""
Test script to verify JavaScript runtime fix for yt-dlp
Run this on the server to test if yt-dlp-ejs is working with cookies
"""
import sys
import os

print("=" * 60)
print("Testing JavaScript Runtime Fix for yt-dlp")
print("=" * 60)
print()

# Check yt-dlp version
try:
    import yt_dlp
    print(f"✅ yt-dlp version: {yt_dlp.__version__}")
except ImportError:
    print("❌ yt-dlp not installed!")
    sys.exit(1)

# Check yt-dlp-ejs
try:
    import yt_dlp_ejs
    print(f"✅ yt-dlp-ejs installed: {yt_dlp_ejs.__version__}")
except ImportError:
    print("⚠️  yt-dlp-ejs not found - this may cause issues!")
    print("   Install with: pip install yt-dlp[default]")

# Check Node.js
import subprocess
try:
    result = subprocess.run(['node', '--version'], 
                          capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        print(f"✅ Node.js version: {result.stdout.strip()}")
    else:
        print("⚠️  Node.js not accessible")
except Exception as e:
    print(f"⚠️  Could not check Node.js: {e}")

print()
print("=" * 60)
print("Testing yt-dlp with cookies")
print("=" * 60)

# Test URL
test_url = "https://www.youtube.com/watch?v=Wtx3rb2ij8I"
cookie_file = "/app/cookies.txt"

print(f"Test URL: {test_url}")
print(f"Cookie file: {cookie_file}")

# Check if cookie file exists
if os.path.exists(cookie_file):
    file_size = os.path.getsize(cookie_file)
    print(f"✅ Cookie file exists: {file_size} bytes")
    
    # Check if it contains YouTube cookies
    try:
        with open(cookie_file, 'r') as f:
            content = f.read()
            if 'youtube.com' in content or '.youtube.com' in content:
                print("✅ Cookie file contains YouTube cookies")
            else:
                print("⚠️  Cookie file may not contain YouTube cookies")
    except Exception as e:
        print(f"⚠️  Could not read cookie file: {e}")
else:
    print(f"⚠️  Cookie file not found at: {cookie_file}")

print()
print("Testing yt-dlp extract_info with cookies...")
print("-" * 60)

try:
    ydl_opts = {
        'cookiefile': cookie_file,
        'quiet': False,
        'no_warnings': False,
    }
    
    print("Creating YoutubeDL instance...")
    ydl = yt_dlp.YoutubeDL(ydl_opts)
    
    print("Extracting video info...")
    info = ydl.extract_info(test_url, download=False)
    
    if info and info.get('title'):
        print()
        print("=" * 60)
        print("✅ SUCCESS!")
        print("=" * 60)
        print(f"Title: {info.get('title')}")
        print(f"Duration: {info.get('duration')} seconds")
        print(f"Video ID: {info.get('id')}")
        print(f"Uploader: {info.get('uploader', 'N/A')}")
        print()
        
        # Check available formats
        if 'formats' in info:
            print(f"Available formats: {len(info['formats'])}")
            print("✅ Format extraction successful - cookies are working!")
        else:
            print("⚠️  No formats found in info (may be using extract_flat)")
        
        sys.exit(0)
    else:
        print()
        print("=" * 60)
        print("❌ FAILED: No info returned")
        print("=" * 60)
        sys.exit(1)
        
except Exception as e:
    print()
    print("=" * 60)
    print("❌ ERROR")
    print("=" * 60)
    print(f"Error: {e}")
    print()
    import traceback
    traceback.print_exc()
    sys.exit(1)

