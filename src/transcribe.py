#!/usr/bin/env python3
"""
Transcription Module
Handles audio download and transcription with timestamps using Whisper
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Optional
import yt_dlp
from . import config as cli_config


def _make_readonly_cookiejar(cookiejar):
    """Make a cookie jar read-only by monkey-patching the save method"""
    if cookiejar and hasattr(cookiejar, 'save'):
        original_save = cookiejar.save
        def noop_save(filename=None, ignore_discard=False, ignore_expires=False):
            """Override save to do nothing - file is read-only"""
            pass  # Don't save cookies, file is read-only
        cookiejar.save = noop_save
    return cookiejar


def _disable_cookie_saving(ydl):
    """Disable cookie saving on yt-dlp instance to prevent read-only errors"""
    # Patch the cookiejar save method
    if hasattr(ydl, 'cookiejar') and ydl.cookiejar:
        _make_readonly_cookiejar(ydl.cookiejar)
    
    # Also patch save_cookies() method on the YoutubeDL instance itself
    if hasattr(ydl, 'save_cookies'):
        original_save_cookies = ydl.save_cookies
        def noop_save_cookies():
            """Override save_cookies to do nothing - file is read-only"""
            pass  # Don't save cookies, file is read-only
        ydl.save_cookies = noop_save_cookies
    
    return ydl


def _get_ytdlp_base_opts() -> Dict:
    """
    Get base yt-dlp options with cookie support if configured
    
    Returns:
        Dictionary of yt-dlp options
    """
    opts = {}
    
    # Add cookie support if configured
    if cli_config.YT_DLP_COOKIES:
        cookies_value = cli_config.YT_DLP_COOKIES.strip()
        print(f"[yt-dlp] Cookie config found: {cookies_value}")
        
        # Common browser names that yt-dlp supports
        browser_names = ['chrome', 'firefox', 'edge', 'opera', 'safari', 'vivaldi', 'brave']
        
        # Check if it's a browser name (case-insensitive)
        if cookies_value.lower() in browser_names:
            opts['cookiesfrombrowser'] = (cookies_value.lower(),)
            print(f"[yt-dlp] Using cookies from browser: {cookies_value.lower()}")
        else:
            # Treat as file path
            cookies_path = Path(cookies_value)
            cookie_file = None
            
            # If it's an absolute path, use it as-is
            if cookies_path.is_absolute():
                if cookies_path.exists():
                    cookie_file = str(cookies_path)
                    print(f"[yt-dlp] Using absolute cookie file: {cookie_file}")
                else:
                    print(f"[yt-dlp] WARNING: Cookie file not found at absolute path: {cookies_path}")
            # Check if relative path exists
            elif cookies_path.exists():
                cookie_file = str(cookies_path)
                print(f"[yt-dlp] Using relative cookie file: {cookie_file}")
            else:
                # Try relative to project root
                project_root = cli_config.PROJECT_ROOT
                full_path = project_root / cookies_path
                if full_path.exists():
                    cookie_file = str(full_path)
                    print(f"[yt-dlp] Using cookie file from project root: {cookie_file}")
                else:
                    # Last resort: use as-is (might be a path inside container)
                    cookie_file = cookies_value
                    print(f"[yt-dlp] Using cookie path as-is (container path): {cookie_file}")
            
            if cookie_file:
                opts['cookiefile'] = cookie_file
                # Verify file exists if it's a real path
                if Path(cookie_file).exists():
                    file_size = Path(cookie_file).stat().st_size
                    print(f"[yt-dlp] Cookie file verified: {cookie_file} ({file_size} bytes)")
                else:
                    print(f"[yt-dlp] WARNING: Cookie file does not exist: {cookie_file}")
    else:
        print("[yt-dlp] No cookie configuration found (YT_DLP_COOKIES not set)")
    
    return opts


def sanitize_filename(filename: str) -> str:
    """
    Remove invalid characters from filename
    Replace /\:*?"<>| with underscores
    """
    # Remove invalid characters
    sanitized = re.sub(r'[/\\:*?"<>|]', '_', filename)
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip('. ')
    # Limit length to avoid filesystem issues
    if len(sanitized) > 200:
        sanitized = sanitized[:200]
    return sanitized


def format_timestamp(seconds: float) -> str:
    """
    Convert seconds to HH:MM:SS or MM:SS format
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


def download_audio(url: str, output_path: str, audio_format: str = "mp3") -> Optional[str]:
    """
    Download audio from YouTube video (with caching support)
    
    Args:
        url: YouTube video URL
        output_path: Path where audio should be saved (without extension)
        audio_format: Audio format (mp3, m4a, etc.)
    
    Returns:
        Path to downloaded audio file, or None if failed
    """
    # Check if audio already exists (check common extensions)
    for ext in ['.mp3', '.m4a', '.webm', '.opus']:
        potential_file = Path(f"{output_path}{ext}")
        if potential_file.exists():
            print(f"Audio already exists: {potential_file.name}")
            return str(potential_file)
    
    ydl_opts = _get_ytdlp_base_opts()
    ydl_opts.update({
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': audio_format,
            'preferredquality': '192',
        }],
        'outtmpl': output_path,
        'quiet': True,
        'no_warnings': True,
    })
    
    try:
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        # Disable cookie saving to prevent read-only file system errors
        _disable_cookie_saving(ydl)
        try:
            ydl.download([url])
        finally:
            # Close yt-dlp (cookie saving is prevented)
            try:
                ydl.close()
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    pass  # Expected error, ignore
                else:
                    raise
        
        # Find the downloaded audio file
        for ext in ['.mp3', '.m4a', '.webm', '.opus']:
            potential_file = Path(f"{output_path}{ext}")
            if potential_file.exists():
                return str(potential_file)
        
        return None
    except Exception as e:
        print(f"Error downloading audio: {e}")
        return None


def save_transcript_cache(transcript_segments: List[Dict], cache_path: str) -> bool:
    """
    Save transcript segments to a JSON cache file
    
    Args:
        transcript_segments: List of transcript segments
        cache_path: Path where to save the cache file
    
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        cache_path = Path(cache_path)
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(transcript_segments, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Warning: Could not save transcript cache: {e}")
        return False


def load_transcript_cache(cache_path: str) -> Optional[List[Dict]]:
    """
    Load transcript segments from a JSON cache file
    
    Args:
        cache_path: Path to the cache file
    
    Returns:
        List of transcript segments or None if not found/invalid
    """
    try:
        cache_path = Path(cache_path)
        if not cache_path.exists():
            return None
        
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Validate structure
        if isinstance(data, list) and len(data) > 0:
            if all(isinstance(item, dict) and 'start' in item and 'text' in item for item in data):
                print(f"Loaded transcript from cache: {cache_path.name}")
                return data
        
        return None
    except Exception as e:
        print(f"Warning: Could not load transcript cache: {e}")
        return None


def get_audio_duration(audio_path: str) -> Optional[float]:
    """
    Get duration of audio file in seconds
    
    Args:
        audio_path: Path to audio file
    
    Returns:
        Duration in seconds, or None if failed
    """
    try:
        import subprocess
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1', audio_path],
            capture_output=True,
            text=True
        )
        return float(result.stdout.strip())
    except Exception:
        return None


def transcribe_with_timestamps(
    audio_path: str,
    model_name: str = "small",
    device: str = "auto",
    compute_type: str = "int8",
    cache_path: Optional[str] = None,
    show_progress: bool = True,
    progress_callback: Optional[callable] = None
) -> List[Dict[str, any]]:
    """
    Transcribe audio using faster-whisper and return segments with timestamps
    Supports caching to avoid re-transcribing the same audio
    
    Args:
        audio_path: Path to audio file
        model_name: Whisper model size (tiny, base, small, medium, large)
        device: Device to use (cpu, cuda, auto)
        compute_type: Compute type (int8, float16, float32)
        cache_path: Optional path to save/load transcript cache (JSON file)
        show_progress: Whether to show transcription progress (default: True)
    
    Returns:
        List of segments with structure:
        [
            {
                'start': float (seconds),
                'end': float (seconds),
                'text': str,
                'start_formatted': str (HH:MM:SS),
                'end_formatted': str (HH:MM:SS)
            },
            ...
        ]
    """
    # Try to load from cache first
    if cache_path:
        cached_transcript = load_transcript_cache(cache_path)
        if cached_transcript:
            # If loading from cache, notify callback that it's complete
            if progress_callback:
                progress_callback(100)
            return cached_transcript
    
    # No cache found, proceed with transcription
    from faster_whisper import WhisperModel
    import sys
    import time
    
    # Get audio duration for progress tracking
    audio_duration = get_audio_duration(audio_path) if show_progress else None
    
    if show_progress:
        print("Transcribing audio...", flush=True)
        if audio_duration:
            print(f"Audio duration: {format_timestamp(audio_duration)}", flush=True)
    
    print(f"[Transcribe] Loading Whisper model: {model_name} (device={device}, compute_type={compute_type})", flush=True)
    start_time = time.time()
    
    # Update progress callback to show model loading
    if progress_callback:
        try:
            progress_callback(0)  # Show we're starting
        except:
            pass
    
    try:
        print(f"[Transcribe] Creating WhisperModel instance...", flush=True)
        model = WhisperModel(model_name, device=device, compute_type=compute_type)
        load_time = time.time() - start_time
        print(f"[Transcribe] Model loaded successfully in {load_time:.2f} seconds", flush=True)
        
        # Log model info
        if hasattr(model, 'model'):
            print(f"[Transcribe] Model type: {type(model.model)}", flush=True)
    except ImportError as e:
        error_msg = f"Failed to import faster_whisper: {e}"
        print(f"[Transcribe] ERROR: {error_msg}", flush=True)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Failed to load Whisper model: {e}"
        print(f"[Transcribe] ERROR: {error_msg}", flush=True)
        import traceback
        traceback.print_exc()
        raise Exception(error_msg)
    
    print(f"[Transcribe] Starting transcription of: {audio_path}", flush=True)
    transcribe_start = time.time()
    
    try:
        segments_data, info = model.transcribe(audio_path, beam_size=5)
        print(f"[Transcribe] model.transcribe() returned, info={info}", flush=True)
    except Exception as e:
        print(f"[Transcribe] ERROR in model.transcribe(): {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise
    
    # Initial progress update (0%)
    if progress_callback and audio_duration and audio_duration > 0:
        progress_callback(0)
        print(f"[Transcribe] Initial progress callback: 0%", flush=True)
    
    result = []
    last_print_time = 0
    last_callback_time = 0
    segment_count = 0
    
    print(f"[Transcribe] Starting transcription loop, audio_duration={audio_duration}", flush=True)
    loop_start_time = time.time()
    last_segment_time = time.time()
    
    try:
        for segment in segments_data:
            # Check if we're stuck (no segments for 30 seconds)
            current_time = time.time()
            if current_time - last_segment_time > 30:
                print(f"[Transcribe] WARNING: No segments for 30 seconds! Last segment was {current_time - last_segment_time:.1f}s ago", flush=True)
            last_segment_time = current_time
            segment_count += 1
            
            result.append({
                'start': segment.start,
                'end': segment.end,
                'text': segment.text.strip(),
                'start_formatted': format_timestamp(segment.start),
                'end_formatted': format_timestamp(segment.end)
            })
            
            # Calculate progress percentage
            if audio_duration and audio_duration > 0:
                progress_pct = min(100, int((segment.end / audio_duration) * 100))
            else:
                progress_pct = 0
            
            # Update progress callback more frequently, especially at the start
            should_update_callback = False
            if audio_duration and audio_duration > 0:
                # Update every 0.3 seconds of audio OR every 2 segments (more frequent)
                # OR always update for first 10 segments to show progress immediately
                if segment_count <= 10 or segment.end - last_callback_time >= 0.3 or len(result) % 2 == 0:
                    should_update_callback = True
            else:
                # Update every 2 segments if we don't have duration
                if len(result) % 2 == 0:
                    should_update_callback = True
            
            # Call progress callback if provided (very frequently for real-time updates)
            if should_update_callback and progress_callback:
                if audio_duration and audio_duration > 0:
                    progress_callback(progress_pct)
                    if segment_count <= 5 or segment_count % 10 == 0:
                        print(f"[Transcribe] Progress callback: {progress_pct}% (segment {segment_count}, time: {format_timestamp(segment.end)})", flush=True)
                    last_callback_time = segment.end
                else:
                    # Even without duration, update based on segment count
                    estimated_pct = min(95, int((len(result) / 100) * 100))  # Estimate based on segments
                    progress_callback(estimated_pct)
                    if segment_count % 10 == 0:
                        print(f"[Transcribe] Progress callback (no duration): {estimated_pct}% (segment {segment_count})", flush=True)
            
            # Print progress less frequently (every 2 seconds) to avoid too much output
            if segment.end - last_print_time >= 2:
                if show_progress:
                    if audio_duration and audio_duration > 0:
                        print(f"  Progress: {progress_pct}% - {format_timestamp(segment.end)} / {format_timestamp(audio_duration)} - {len(result)} segments", flush=True)
                    else:
                        print(f"  Progress: {format_timestamp(segment.end)} - {len(result)} segments", flush=True)
                last_print_time = segment.end
    except Exception as e:
        print(f"[Transcribe] ERROR in transcription loop: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise
    
    # Final progress update (100%)
    if progress_callback and audio_duration and audio_duration > 0:
        progress_callback(100)
    
    if show_progress:
        print(f"  ✓ Transcription complete: {len(result)} segments", flush=True)
    
    # Save to cache if path provided
    if cache_path and result:
        save_transcript_cache(result, cache_path)
    
    return result


def get_full_transcript(segments: List[Dict[str, any]], include_timestamps: bool = True) -> str:
    """
    Convert segments list to formatted transcript string
    
    Args:
        segments: List of segment dictionaries from transcribe_with_timestamps
        include_timestamps: Whether to include timestamps in output
    
    Returns:
        Formatted transcript string
    """
    if include_timestamps:
        lines = [f"[{seg['start_formatted']}] {seg['text']}" for seg in segments]
        return "\n".join(lines)
    else:
        return " ".join(seg['text'] for seg in segments)


def get_video_metadata(url: str) -> Optional[Dict[str, any]]:
    """
    Extract video metadata without downloading
    
    Args:
        url: YouTube video URL
    
    Returns:
        Dictionary with video metadata (title, duration, etc.) or None if failed
    """
    ydl_opts = _get_ytdlp_base_opts()
    ydl_opts.update({
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
    })
    
    try:
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        # Disable cookie saving to prevent read-only file system errors
        _disable_cookie_saving(ydl)
        try:
            info = ydl.extract_info(url, download=False)
            return {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'url': url,
                'id': info.get('id', ''),
                'description': info.get('description', ''),
            }
        finally:
            # Close yt-dlp (cookie saving is prevented)
            try:
                ydl.close()
            except OSError as e:
                if 'Read-only file system' in str(e) or 'read-only' in str(e).lower():
                    pass  # Expected error, ignore
                else:
                    raise
    except Exception as e:
        print(f"Error extracting metadata from {url}: {e}")
        return None

