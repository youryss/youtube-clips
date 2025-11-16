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
            # Remove leading dot if present
            if domain.startswith('.'):
                domain_flag = 'TRUE'
                domain = domain[1:]
            else:
                domain_flag = 'FALSE'
            
            path = cookie.get('path', '/')
            secure = 'TRUE' if cookie.get('secure', False) else 'FALSE'
            expires = str(int(cookie.get('expires', -1))) if cookie.get('expires') else '0'
            name = cookie.get('name', '')
            value = cookie.get('value', '')
            
            # Netscape format: domain, flag, path, secure, expiration, name, value
            f.write(f"{domain}\t{domain_flag}\t{path}\t{secure}\t{expires}\t{name}\t{value}\n")


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
            print("\n⚠️  Password not provided. Please complete login manually in the browser window.")
            print("Press Enter once you've logged in...")
            input()
        
        # Wait for YouTube to load (logged in)
        try:
            page.wait_for_url("https://www.youtube.com/**", timeout=30000)
            print("✓ Successfully logged in to YouTube")
            return True
        except Exception as e:
            print(f"Login verification failed: {e}")
            return False
            
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
            
            # Get cookies
            print("\nExtracting cookies...")
            cookies = context.cookies()
            
            # Filter for YouTube cookies
            youtube_cookies = [
                c for c in cookies 
                if 'youtube.com' in c.get('domain', '') or '.youtube.com' in c.get('domain', '')
            ]
            
            if not youtube_cookies:
                print("⚠️  Warning: No YouTube cookies found")
            else:
                print(f"✓ Found {len(youtube_cookies)} YouTube cookies")
            
            # Export to Netscape format
            print(f"\nExporting cookies to {output_file}...")
            export_cookies_to_netscape(cookies, output_file)
            print(f"✓ Cookies exported successfully!")
            
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

