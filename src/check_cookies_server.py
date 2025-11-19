#!/usr/bin/env python3
"""
Check if cookies are valid and notify if they need refresh
This runs on the server and checks cookie validity
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta


def check_cookies_validity(cookie_file: str = '/app/cookies.txt') -> dict:
    """
    Check if cookies file exists and has valid YouTube cookies
    
    Returns:
        dict with status information
    """
    result = {
        'exists': False,
        'size': 0,
        'has_youtube_cookies': False,
        'has_auth_cookies': False,
        'file_age_hours': None,
        'needs_refresh': False,
    }
    
    cookie_path = Path(cookie_file)
    
    if not cookie_path.exists():
        result['needs_refresh'] = True
        return result
    
    result['exists'] = True
    result['size'] = cookie_path.stat().st_size
    
    # Check file age
    file_mtime = datetime.fromtimestamp(cookie_path.stat().st_mtime)
    age = datetime.now() - file_mtime
    result['file_age_hours'] = age.total_seconds() / 3600
    
    # If file is older than 12 hours, needs refresh
    if result['file_age_hours'] > 12:
        result['needs_refresh'] = True
    
    # Check cookie content
    try:
        with open(cookie_path, 'r') as f:
            content = f.read()
            
            # Check for YouTube cookies
            if 'youtube.com' in content or '.youtube.com' in content:
                result['has_youtube_cookies'] = True
            
            # Check for authentication cookies
            auth_cookies = ['LOGIN_INFO', 'SAPISID', '__Secure-1PSID', '__Secure-3PSID']
            has_auth = any(cookie in content for cookie in auth_cookies)
            result['has_auth_cookies'] = has_auth
            
            if not has_auth:
                result['needs_refresh'] = True
                
    except Exception as e:
        print(f"Error reading cookies: {e}")
        result['needs_refresh'] = True
    
    return result


def main():
    cookie_file = os.getenv('YT_DLP_COOKIES', '/app/cookies.txt')
    
    print("=" * 60)
    print("🔍 Checking cookies validity...")
    print("=" * 60)
    
    status = check_cookies_validity(cookie_file)
    
    print(f"File exists: {status['exists']}")
    if status['exists']:
        print(f"File size: {status['size']} bytes")
        print(f"File age: {status['file_age_hours']:.1f} hours")
        print(f"Has YouTube cookies: {status['has_youtube_cookies']}")
        print(f"Has auth cookies: {status['has_auth_cookies']}")
    
    print(f"\nNeeds refresh: {status['needs_refresh']}")
    
    if status['needs_refresh']:
        print("\n⚠️  Cookies need to be refreshed!")
        print("Run: python3 src/generate_cookies.py --email your@email.com")
        return 1
    else:
        print("\n✅ Cookies are valid!")
        return 0


if __name__ == '__main__':
    sys.exit(main())

