#!/usr/bin/env python3
"""
Video Slicer Module
Slices videos into clips using ffmpeg
"""

import subprocess
from pathlib import Path
from typing import Optional, List, Dict
import json

# Import config from src package to avoid conflicts with backend config
try:
    from . import config  # When imported as a module
except ImportError:
    import config  # When run directly


def format_time_for_ffmpeg(seconds: float) -> str:
    """
    Convert seconds to ffmpeg time format (HH:MM:SS.mmm)
    
    Args:
        seconds: Time in seconds
    
    Returns:
        Formatted time string
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"


def slice_video(
    input_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    padding_before: float = 0,
    padding_after: float = 0,
    re_encode: bool = False
) -> bool:
    """
    Slice a video segment using ffmpeg
    
    Args:
        input_path: Path to input video file
        output_path: Path where output clip should be saved
        start_time: Start time in seconds
        end_time: End time in seconds
        padding_before: Seconds to add before start_time
        padding_after: Seconds to add after end_time
        re_encode: Whether to re-encode (True) or copy (False, faster)
    
    Returns:
        True if successful, False otherwise
    """
    # Apply padding
    actual_start = max(0, start_time - padding_before)
    actual_end = end_time + padding_after
    duration = actual_end - actual_start
    
    # Format times for ffmpeg
    start_str = format_time_for_ffmpeg(actual_start)
    duration_str = format_time_for_ffmpeg(duration)
    
    # Build ffmpeg command
    if re_encode:
        # Re-encode (slower but more reliable)
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-ss', start_str,
            '-t', duration_str,
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-strict', 'experimental',
            '-b:a', '192k',
            '-y',  # Overwrite output file
            output_path
        ]
    else:
        # Copy streams (faster, no quality loss)
        cmd = [
            'ffmpeg',
            '-ss', start_str,
            '-i', input_path,
            '-t', duration_str,
            '-c', 'copy',
            '-y',  # Overwrite output file
            output_path
        ]
    
    try:
        # Run ffmpeg
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"Error slicing video: {e}")
        print(f"FFmpeg stderr: {e.stderr.decode('utf-8')}")
        
        # If copy failed, try re-encoding
        if not re_encode:
            print("Retrying with re-encoding...")
            return slice_video(
                input_path, output_path, start_time, end_time,
                padding_before, padding_after, re_encode=True
            )
        
        return False
    
    except FileNotFoundError:
        print("Error: ffmpeg not found. Please install ffmpeg:")
        print("  macOS: brew install ffmpeg")
        print("  Linux: sudo apt install ffmpeg")
        print("  Windows: Download from https://ffmpeg.org/")
        return False


def slice_video_batch(
    input_path: str,
    segments: List[Dict],
    output_dir: str,
    base_filename: str,
    save_metadata: bool = True
) -> List[Dict]:
    """
    Slice multiple segments from a video
    
    Args:
        input_path: Path to input video
        segments: List of segment dictionaries with start/end times and metadata
        output_dir: Directory to save clips
        base_filename: Base name for output files (will add numbers)
        save_metadata: Whether to save metadata JSON for each clip
    
    Returns:
        List of dictionaries with clip information:
        [
            {
                'clip_path': str,
                'metadata_path': str,
                'success': bool,
                'segment': Dict (original segment data)
            },
            ...
        ]
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    results = []
    
    for idx, segment in enumerate(segments, 1):
        # Generate output filename
        clip_name = f"{base_filename}_clip{idx:02d}.mp4"
        clip_path = output_dir / clip_name
        
        print(f"Creating clip {idx}/{len(segments)}: {clip_name}")
        print(f"  Time: {segment.get('start_time', '00:00')} - {segment.get('end_time', '00:00')}")
        print(f"  Title: {segment.get('suggested_title', 'Untitled')}")
        
        # Slice video
        success = slice_video(
            input_path=input_path,
            output_path=str(clip_path),
            start_time=segment.get('start_seconds', 0),
            end_time=segment.get('end_seconds', 0),
            padding_before=config.CLIP_PADDING_BEFORE,
            padding_after=config.CLIP_PADDING_AFTER,
            re_encode=False
        )
        
        result = {
            'clip_path': str(clip_path),
            'success': success,
            'segment': segment
        }
        
        # Save metadata
        if success and save_metadata:
            metadata_path = output_dir / f"{base_filename}_clip{idx:02d}_metadata.json"
            
            metadata = {
                'clip_filename': clip_name,
                'source_video': str(input_path),
                'start_time': segment.get('start_time', '00:00'),
                'end_time': segment.get('end_time', '00:00'),
                'start_seconds': segment.get('start_seconds', 0),
                'end_seconds': segment.get('end_seconds', 0),
                'duration_seconds': segment.get('duration_seconds', 0),
                'viral_score': segment.get('viral_score', 0),
                'criteria_matched': segment.get('criteria_matched', []),
                'reasoning': segment.get('reasoning', ''),
                'suggested_title': segment.get('suggested_title', ''),
                'padding_before': config.CLIP_PADDING_BEFORE,
                'padding_after': config.CLIP_PADDING_AFTER,
            }
            
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2)
            
            result['metadata_path'] = str(metadata_path)
            print(f"  ✓ Saved clip and metadata")
        elif success:
            print(f"  ✓ Saved clip")
        else:
            print(f"  ✗ Failed to create clip")
        
        results.append(result)
    
    return results


def get_video_duration(video_path: str) -> Optional[float]:
    """
    Get the duration of a video file using ffprobe
    
    Args:
        video_path: Path to video file
    
    Returns:
        Duration in seconds, or None if failed
    """
    cmd = [
        'ffprobe',
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        video_path
    ]
    
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        return float(result.stdout.decode('utf-8').strip())
    except Exception as e:
        print(f"Error getting video duration: {e}")
        return None


def validate_segment_times(segment: Dict, video_duration: float) -> bool:
    """
    Validate that segment times are within video duration
    
    Args:
        segment: Segment dictionary with start/end times
        video_duration: Duration of the video in seconds
    
    Returns:
        True if valid, False otherwise
    """
    start = segment.get('start_seconds', 0)
    end = segment.get('end_seconds', 0)
    
    if start < 0 or end < 0:
        return False
    
    if start >= end:
        return False
    
    if end > video_duration:
        return False
    
    return True

