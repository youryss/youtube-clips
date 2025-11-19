#!/usr/bin/env python3
"""
Automated cookie refresh script for server use
This version works inside Docker container and uses Playwright in headless mode
"""

import sys
import os
from pathlib import Path


def refresh_cookies_via_playwright(email: str, output_file: str = '/app/cookies.txt'):
    """
    Refresh cookies using Playwright (headless)
    This requires Playwright to be installed in the container
    """
    print("=" * 60)
    print("🔄 Refreshing YouTube cookies...")
    print("=" * 60)
    
    # Check if we can import playwright
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("❌ Playwright not available in container")
        print("💡 Install with: pip install playwright && playwright install chromium")
        return False
    
    # Import the generate_cookies function
    try:
        # Import generate_cookies directly
        sys.path.insert(0, '/app')
        from generate_cookies import generate_cookies
        
        print(f"Generating cookies for: {email}")
        print("⚠️  Running in headless mode - cookies may need manual intervention")
        
        generate_cookies(
            email=email,
            password=None,  # Will need manual login in headless mode
            output_file=output_file,
            headless=True  # Must be headless in server
        )
        
        # Verify cookies were created
        if Path(output_file).exists() and Path(output_file).stat().st_size > 0:
            print("✅ Cookies refreshed successfully!")
            return True
        else:
            print("⚠️  Cookie file created but may be empty")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Automated YouTube cookie refresh (server version)')
    parser.add_argument('--email', required=True, help='YouTube/Google account email')
    parser.add_argument('--output', default='/app/cookies.txt', help='Output file path')
    parser.add_argument('--restart-backend', action='store_true', help='Restart backend after refresh')
    
    args = parser.parse_args()
    
    # Refresh cookies
    if refresh_cookies_via_playwright(args.email, args.output):
        print("\n✅ Done! Cookies refreshed.")
        
        if args.restart_backend:
            print("🔄 Restarting backend...")
            # This would need to be called from outside the container
            # or use docker-compose exec
            print("⚠️  Run: docker-compose restart backend")
        
        return 0
    else:
        print("\n❌ Failed to refresh cookies")
        return 1


if __name__ == '__main__':
    sys.exit(main())

