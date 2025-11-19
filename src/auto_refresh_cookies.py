#!/usr/bin/env python3
"""
Automated cookie refresh script
Run this periodically (e.g., every 6 hours) to keep cookies fresh
"""

import sys
import subprocess
import argparse
from pathlib import Path


def refresh_cookies(email: str, output_file: str = 'cookies.txt', headless: bool = True):
    """Refresh YouTube cookies"""
    print("=" * 60)
    print("🔄 Refreshing YouTube cookies...")
    print("=" * 60)
    
    script_path = Path(__file__).parent / 'generate_cookies.py'
    
    cmd = [
        sys.executable,
        str(script_path),
        '--email', email,
        '--output', output_file,
    ]
    
    if headless:
        cmd.append('--headless')
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("✅ Cookies refreshed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error refreshing cookies: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return False


def upload_cookies(server_ip: str, server_user: str, server_path: str):
    """Upload cookies to server"""
    print("\n" + "=" * 60)
    print("📤 Uploading cookies to server...")
    print("=" * 60)
    
    upload_script = Path(__file__).parent.parent / 'scripts' / 'upload_cookies.sh'
    
    if not upload_script.exists():
        print("❌ upload_cookies.sh not found!")
        return False
    
    try:
        result = subprocess.run(['bash', str(upload_script)], check=True)
        print("✅ Cookies uploaded successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error uploading cookies: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Automated YouTube cookie refresh')
    parser.add_argument('--email', required=True, help='YouTube/Google account email')
    parser.add_argument('--output', default='cookies.txt', help='Output file path')
    parser.add_argument('--headless', action='store_true', help='Run browser in headless mode')
    parser.add_argument('--upload', action='store_true', help='Upload cookies to server after refresh')
    parser.add_argument('--server-ip', default='164.90.193.41', help='Server IP address')
    parser.add_argument('--server-user', default='root', help='Server user')
    parser.add_argument('--server-path', default='~/youtube-viral-clipper', help='Server path')
    
    args = parser.parse_args()
    
    # Refresh cookies
    if refresh_cookies(args.email, args.output, args.headless):
        # Upload if requested
        if args.upload:
            upload_cookies(args.server_ip, args.server_user, args.server_path)
        print("\n✅ Done!")
        return 0
    else:
        print("\n❌ Failed to refresh cookies")
        return 1


if __name__ == '__main__':
    sys.exit(main())

