#!/usr/bin/env python3
"""
Generate YouTube cookies using headless browser automation
This script uses Playwright to automate browser login and extract cookies

Requirements:
    pip install playwright
    playwright install chromium

Usage:
    python3 src/generate_cookies.py --email your@email.com --output cookies.txt
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

try:
    from playwright.sync_api import sync_playwright, Browser, Page
except ImportError:
    print("Error: playwright not installed. Install with: pip install playwright")
    print("Then run: playwright install chromium")
    sys.exit(1)


def export_cookies_to_netscape(cookies: list, output_file: str):
    """Convert browser cookies to Netscape format for yt-dlp"""
    with open(output_file, 'w') as f:
        # Write Netscape cookie file header
        f.write("# Netscape HTTP Cookie File\n")
        f.write("# https://curl.haxx.se/rfc/cookie_spec.html\n")
        f.write("# This is a generated file! Do not edit.\n\n")
        
        for cookie in cookies:
            domain = cookie.get('domain', '')
            
            # Netscape format rules (from Python's http.cookiejar):
            # - domain_specified flag: TRUE if domain was explicitly set (has leading dot)
            # - domain_specified flag: FALSE if domain was not explicitly set (no leading dot)
            # - BUT: The domain field should ALWAYS have a leading dot in Netscape format
            # - The flag indicates whether the cookie was set with an explicit domain
            
            # Always add leading dot for Netscape format
            if not domain.startswith('.'):
                domain = '.' + domain
            
            # domain_specified flag: TRUE if cookie was set with explicit domain
            # We check the original domain from the cookie to determine this
            original_domain = cookie.get('domain', '')
            if original_domain.startswith('.'):
                domain_flag = 'TRUE'  # Explicit domain was set
            else:
                domain_flag = 'FALSE'  # Domain was not explicitly set (host-only cookie)
            
            path = cookie.get('path', '/')
            secure = 'TRUE' if cookie.get('secure', False) else 'FALSE'
            
            # Handle expiration - convert to Unix timestamp if needed
            expires = cookie.get('expires', -1)
            if expires == -1 or expires is None:
                expires_str = '0'  # Session cookie
            else:
                # If expires is already a timestamp, use it; otherwise convert
                if expires > 1000000000:  # Likely already a Unix timestamp
                    expires_str = str(int(expires))
                else:
                    # Might be in seconds since epoch, try converting
                    expires_str = str(int(expires))
            
            name = cookie.get('name', '')
            value = cookie.get('value', '')
            
            # Netscape format: domain, domain_specified_flag, path, secure_flag, expiration, name, value
            f.write(f"{domain}\t{domain_flag}\t{path}\t{secure}\t{expires_str}\t{name}\t{value}\n")


def handle_cookie_consent(page: Page) -> bool:
    """Handle Google cookie consent dialog"""
    try:
        # Wait a bit for the dialog to appear
        page.wait_for_timeout(2000)
        
        # Try to find and click "Accept all" button
        accept_selectors = [
            'button:has-text("Accept all")',
            'button:has-text("Accept All")',
            'button[aria-label*="Accept"]',
            'button:has-text("I agree")',
            'button[id*="accept"]',
            'button[class*="accept"]',
        ]
        
        for selector in accept_selectors:
            try:
                button = page.query_selector(selector)
                if button:
                    button.click()
                    print("✓ Accepted cookie consent")
                    page.wait_for_timeout(1000)  # Wait for dialog to close
                    return True
            except:
                continue
        
        # If no accept button found, try to find and click "Reject all" as fallback
        reject_selectors = [
            'button:has-text("Reject all")',
            'button:has-text("Reject All")',
            'button[aria-label*="Reject"]',
        ]
        
        for selector in reject_selectors:
            try:
                button = page.query_selector(selector)
                if button:
                    button.click()
                    print("✓ Rejected cookie consent (will proceed anyway)")
                    page.wait_for_timeout(1000)
                    return True
            except:
                continue
        
        print("⚠️  Cookie consent dialog not found (may have already been handled)")
        return True  # Continue anyway
    except Exception as e:
        print(f"⚠️  Could not handle cookie consent: {e} (continuing anyway)")
        return True  # Continue anyway


def login_to_youtube(page: Page, email: str, password: Optional[str] = None) -> bool:
    """Automate YouTube login"""
    print(f"Navigating to YouTube...")
    page.goto("https://www.youtube.com", wait_until="networkidle")
    
    # Handle cookie consent dialog
    print("Checking for cookie consent dialog...")
    handle_cookie_consent(page)
    
    # Wait for and click sign in button
    try:
        print("Looking for sign in button...")
        sign_in_button = page.wait_for_selector('a[aria-label*="Sign in"], button[aria-label*="Sign in"], a[href*="accounts.google.com"]', timeout=10000)
        sign_in_button.click()
        print("Clicked sign in button")
        page.wait_for_timeout(2000)  # Wait for navigation
    except Exception as e:
        print(f"Could not find sign in button: {e}")
        # Try navigating directly to accounts.google.com
        print("Trying direct navigation to Google sign in...")
        page.goto("https://accounts.google.com/signin")
        page.wait_for_timeout(2000)
    
    # Handle cookie consent on Google login page if it appears
    handle_cookie_consent(page)
    
    # Wait for Google login page
    try:
        print("Waiting for Google login page...")
        page.wait_for_selector('input[type="email"], input[name="identifier"], input[id="identifierId"]', timeout=10000)
        
        # Enter email
        email_input = page.query_selector('input[type="email"], input[name="identifier"], input[id="identifierId"]')
        if email_input:
            email_input.fill(email)
            print(f"Entered email: {email}")
            page.wait_for_timeout(500)
            
            # Click next - try multiple selectors
            next_selectors = [
                'button:has-text("Next")',
                'button#identifierNext',
                'button[type="button"]:has-text("Next")',
                'div#identifierNext',
                'button[jsname="LgbsSe"]',
            ]
            
            clicked = False
            for selector in next_selectors:
                try:
                    next_button = page.query_selector(selector)
                    if next_button and next_button.is_visible():
                        next_button.click()
                        print("Clicked Next")
                        clicked = True
                        break
                except:
                    continue
            
            if not clicked:
                print("⚠️  Could not find Next button, trying Enter key...")
                page.keyboard.press('Enter')
            
            page.wait_for_timeout(2000)
        else:
            print("Could not find email input")
            return False
        
        # If password provided, enter it
        if password:
            try:
                page.wait_for_selector('input[type="password"]', timeout=10000)
                password_input = page.query_selector('input[type="password"]')
                if password_input:
                    password_input.fill(password)
                    print("Entered password")
                    
                    # Click next
                    next_button = page.query_selector('button:has-text("Next"), button#passwordNext')
                    if next_button:
                        next_button.click()
                        print("Clicked Next")
            except Exception as e:
                print(f"Password entry failed (may need manual entry): {e}")
        else:
            print("\n" + "=" * 60)
            print("⚠️  Password not provided.")
            print("=" * 60)
            print("Please complete login manually in the browser window that opened.")
            print("")
            print("Steps:")
            print("1. Enter your password in the browser")
            print("2. Complete any 2FA if required")
            print("3. Wait until you see YouTube homepage")
            print("4. Come back here and press Enter")
            print("")
            print("The browser window will stay open - don't close it yet!")
            print("=" * 60)
            try:
                input("Press Enter once you're logged in to YouTube...")
            except (EOFError, KeyboardInterrupt):
                print("\n⚠️  Input interrupted. Continuing anyway...")
                print("Make sure you're logged in in the browser, then we'll extract cookies.")
                import time
                time.sleep(5)  # Give user time to complete login
        
        # Wait for YouTube to load (logged in)
        # Give extra time for manual login completion
        print("\nWaiting for you to complete login...")
        import time
        time.sleep(3)  # Give user time to complete any manual steps
        
        try:
            # Check current URL - if still on accounts.google.com, wait more
            current_url = page.url
            if 'accounts.google.com' in current_url:
                print("Still on login page, waiting for redirect to YouTube...")
                page.wait_for_url("https://www.youtube.com/**", timeout=60000)  # 60 second timeout
            else:
                # Already on YouTube, just verify
                page.wait_for_timeout(2000)
            
            # Final check - make sure we're on YouTube
            if 'youtube.com' in page.url:
                print("✓ Successfully logged in to YouTube")
                return True
            else:
                print(f"⚠️  Unexpected URL: {page.url}")
                print("Continuing anyway - make sure you're logged in...")
                return True  # Continue anyway
        except Exception as e:
            print(f"⚠️  Login verification warning: {e}")
            print("Continuing anyway - we'll try to extract cookies...")
            return True  # Continue anyway - user might be logged in
            
    except Exception as e:
        print(f"Login process failed: {e}")
        return False


def generate_cookies(email: str, password: Optional[str], output_file: str, headless: bool = False):
    """Generate YouTube cookies using browser automation"""
    print("=" * 60)
    print("YouTube Cookie Generator")
    print("=" * 60)
    
    with sync_playwright() as p:
        # Launch browser
        print("\nLaunching browser...")
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # Login to YouTube
            if not login_to_youtube(page, email, password):
                print("❌ Failed to login to YouTube")
                browser.close()
                sys.exit(1)
            
            # Wait a bit to ensure all cookies are set
            print("\nWaiting for cookies to be fully set...")
            page.wait_for_timeout(3000)
            
            # Navigate to YouTube to ensure we have all cookies
            page.goto("https://www.youtube.com")
            page.wait_for_timeout(2000)
            
            # Get cookies
            print("\nExtracting cookies...")
            cookies = context.cookies()
            
            # Filter for YouTube and Google cookies (both are needed)
            important_cookies = [
                c for c in cookies 
                if 'youtube.com' in c.get('domain', '') or 
                   '.youtube.com' in c.get('domain', '') or
                   'google.com' in c.get('domain', '') or
                   '.google.com' in c.get('domain', '')
            ]
            
            # Check for critical authentication cookies
            cookie_names = [c.get('name', '') for c in important_cookies]
            critical_cookies = ['LOGIN_INFO', 'SAPISID', 'APISID', '__Secure-1PSID', '__Secure-3PSID', 'SID']
            found_critical = [name for name in critical_cookies if any(name in c for c in cookie_names)]
            
            if found_critical:
                print(f"✓ Found critical auth cookies: {', '.join(found_critical)}")
            else:
                print("⚠️  Warning: No critical authentication cookies found!")
                print("   Make sure you're fully logged in to YouTube")
            
            if not important_cookies:
                print("⚠️  Warning: No YouTube/Google cookies found")
            else:
                print(f"✓ Found {len(important_cookies)} YouTube/Google cookies")
            
            # Export to Netscape format (use all cookies, not just YouTube ones)
            print(f"\nExporting cookies to {output_file}...")
            export_cookies_to_netscape(cookies, output_file)
            print(f"✓ Cookies exported successfully!")
            
            # Verify the exported file
            if Path(output_file).exists():
                file_size = Path(output_file).stat().st_size
                print(f"✓ Cookie file size: {file_size} bytes")
                
                # Check if critical cookies are in the file
                with open(output_file, 'r') as f:
                    content = f.read()
                    if 'LOGIN_INFO' in content or 'SAPISID' in content or '__Secure-1PSID' in content:
                        print("✓ Authentication cookies found in exported file")
                    else:
                        print("⚠️  Warning: Authentication cookies may be missing")
                        print("   Try logging out and back in, then regenerate cookies")
            
        finally:
            browser.close()
    
    print("\n" + "=" * 60)
    print("✅ Done! You can now use the cookies file with yt-dlp")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Generate YouTube cookies using browser automation"
    )
    parser.add_argument(
        '--email',
        required=True,
        help='YouTube/Google account email'
    )
    parser.add_argument(
        '--password',
        help='Account password (optional, will prompt for manual login if not provided)'
    )
    parser.add_argument(
        '--output',
        default='cookies.txt',
        help='Output file path (default: cookies.txt)'
    )
    parser.add_argument(
        '--headless',
        action='store_true',
        help='Run browser in headless mode (not recommended for first-time login)'
    )
    
    args = parser.parse_args()
    
    generate_cookies(
        email=args.email,
        password=args.password,
        output_file=args.output,
        headless=args.headless
    )


if __name__ == '__main__':
    main()

