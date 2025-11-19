#!/usr/bin/env python3
"""
Alternative download strategies for YouTube videos
Implements multiple bypass techniques
"""

import os
import random
import yt_dlp
from typing import Dict, Optional, List
from pathlib import Path


# Pool of user agents to rotate
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
]


def get_random_user_agent() -> str:
    """Get a random user agent"""
    return random.choice(USER_AGENTS)


def get_video_info_with_proxy(url: str, proxy: Optional[str] = None) -> Optional[Dict]:
    """
    Get video info using proxy rotation
    
    Args:
        url: YouTube video URL
        proxy: Proxy URL (e.g., 'http://proxy:port' or 'socks5://proxy:port')
    
    Returns:
        Video info dict or None
    """
    base_opts = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': get_random_user_agent(),
        'referer': 'https://www.youtube.com/',
        'skip_download': True,
        'extract_flat': True,
        'noplaylist': True,
    }
    
    if proxy:
        base_opts['proxy'] = proxy
    
    strategies = [
        {'extractor_args': {'youtube': {'player_client': ['ios']}}},
        {'extractor_args': {'youtube': {'player_client': ['android']}}},
        {'extractor_args': {'youtube': {'player_client': ['web']}}},
        {'extractor_args': {'youtube': {'player_client': ['mweb']}}},
    ]
    
    for strategy in strategies:
        try:
            opts = {**base_opts, **strategy}
            ydl = yt_dlp.YoutubeDL(opts)
            info = ydl.extract_info(url, download=False)
            
            if info and info.get('title'):
                return {
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'url': url,
                    'id': info.get('id', ''),
                    'description': info.get('description', ''),
                    'uploader': info.get('uploader', ''),
                    'view_count': info.get('view_count', 0),
                }
        except Exception as e:
            continue
    
    return None


def get_video_info_with_po_token(url: str, po_token: Optional[str] = None) -> Optional[Dict]:
    """
    Get video info using PO Token (YouTube's new authentication)
    
    Args:
        url: YouTube video URL
        po_token: PO Token from YouTube (requires manual extraction)
    
    Returns:
        Video info dict or None
    """
    if not po_token:
        return None
    
    opts = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': get_random_user_agent(),
        'referer': 'https://www.youtube.com/',
        'skip_download': True,
        'extract_flat': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['mweb'],
                'player_skip': ['webpage', 'configs'],
            }
        },
    }
    
    # Add PO token to headers
    opts['http_headers'] = {
        'Authorization': f'SAPISIDHASH {po_token}',
    }
    
    try:
        ydl = yt_dlp.YoutubeDL(opts)
        info = ydl.extract_info(url, download=False)
        
        if info and info.get('title'):
            return {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'url': url,
                'id': info.get('id', ''),
                'description': info.get('description', ''),
                'uploader': info.get('uploader', ''),
                'view_count': info.get('view_count', 0),
            }
    except Exception:
        pass
    
    return None


def get_video_info_with_visitor_data(url: str, visitor_data: Optional[str] = None) -> Optional[Dict]:
    """
    Get video info using visitor data (alternative to cookies)
    
    Args:
        url: YouTube video URL
        visitor_data: Visitor data string from YouTube
    
    Returns:
        Video info dict or None
    """
    if not visitor_data:
        return None
    
    opts = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': get_random_user_agent(),
        'referer': 'https://www.youtube.com/',
        'skip_download': True,
        'extract_flat': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['web'],
                'player_skip': ['webpage', 'configs'],
                'visitor_data': visitor_data,
            }
        },
    }
    
    try:
        ydl = yt_dlp.YoutubeDL(opts)
        info = ydl.extract_info(url, download=False)
        
        if info and info.get('title'):
            return {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'url': url,
                'id': info.get('id', ''),
                'description': info.get('description', ''),
                'uploader': info.get('uploader', ''),
                'view_count': info.get('view_count', 0),
            }
    except Exception:
        pass
    
    return None


def get_video_info_auto_retry(url: str, max_retries: int = 5) -> Optional[Dict]:
    """
    Auto-retry with different strategies and delays
    
    Args:
        url: YouTube video URL
        max_retries: Maximum number of retries
    
    Returns:
        Video info dict or None
    """
    import time
    
    strategies = [
        # Strategy 1: iOS client
        lambda: _try_strategy(url, {'extractor_args': {'youtube': {'player_client': ['ios']}}}),
        # Strategy 2: Android client
        lambda: _try_strategy(url, {'extractor_args': {'youtube': {'player_client': ['android']}}}),
        # Strategy 3: Web client
        lambda: _try_strategy(url, {'extractor_args': {'youtube': {'player_client': ['web']}}}),
        # Strategy 4: Mweb client
        lambda: _try_strategy(url, {'extractor_args': {'youtube': {'player_client': ['mweb']}}}),
        # Strategy 5: TV client
        lambda: _try_strategy(url, {'extractor_args': {'youtube': {'player_client': ['tv_embedded']}}}),
    ]
    
    for attempt in range(max_retries):
        for strategy in strategies:
            try:
                result = strategy()
                if result:
                    return result
            except Exception:
                continue
        
        # Exponential backoff
        if attempt < max_retries - 1:
            delay = 2 ** attempt
            time.sleep(delay)
    
    return None


def _try_strategy(url: str, strategy_opts: Dict) -> Optional[Dict]:
    """Try a specific strategy"""
    opts = {
        'quiet': True,
        'no_warnings': True,
        'user_agent': get_random_user_agent(),
        'referer': 'https://www.youtube.com/',
        'skip_download': True,
        'extract_flat': True,
        'noplaylist': True,
        **strategy_opts,
    }
    
    ydl = yt_dlp.YoutubeDL(opts)
    info = ydl.extract_info(url, download=False)
    
    if info and info.get('title'):
        return {
            'title': info.get('title', 'Unknown'),
            'duration': info.get('duration', 0),
            'url': url,
            'id': info.get('id', ''),
            'description': info.get('description', ''),
            'uploader': info.get('uploader', ''),
            'view_count': info.get('view_count', 0),
        }
    
    return None

