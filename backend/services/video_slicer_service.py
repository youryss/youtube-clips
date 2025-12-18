#!/usr/bin/env python3
"""
Video Slicer Service
Service for slicing videos into clips
"""

import subprocess
from pathlib import Path
from typing import List, Dict

from .processing_config import CLIP_PADDING_BEFORE, CLIP_PADDING_AFTER


class VideoSlicerService:
    """Service for slicing videos into clips"""
    
    @staticmethod
    def _format_time_for_ffmpeg(seconds: float) -> str:
        """Convert seconds to ffmpeg time format (HH:MM:SS.mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        milliseconds = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"
    
    @staticmethod
    def _slice_video(
        input_path: str,
        output_path: str,
        start_time: float,
        end_time: float,
        padding_before: float = 0,
        padding_after: float = 0,
        re_encode: bool = False
    ) -> bool:
        """Slice a video segment using ffmpeg"""
        # Apply padding
        actual_start = max(0, start_time - padding_before)
        actual_end = end_time + padding_after
        duration = actual_end - actual_start
        
        # Format times for ffmpeg
        start_str = VideoSlicerService._format_time_for_ffmpeg(actual_start)
        duration_str = VideoSlicerService._format_time_for_ffmpeg(duration)
        
        # Build ffmpeg command
        if re_encode:
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-ss', start_str,
                '-t', duration_str,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-strict', 'experimental',
                '-b:a', '192k',
                '-avoid_negative_ts', 'make_zero',
                '-y',
                output_path
            ]
        else:
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-ss', start_str,
                '-t', duration_str,
                '-c', 'copy',
                '-avoid_negative_ts', 'make_zero',
                '-y',
                output_path
            ]
        
        try:
            subprocess.run(
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
                return VideoSlicerService._slice_video(
                    input_path, output_path, start_time, end_time,
                    padding_before, padding_after, re_encode=True
                )
            
            return False
        
        except FileNotFoundError:
            print("Error: ffmpeg not found. Please install ffmpeg:")
            print("  macOS: brew install ffmpeg")
            print("  Linux: sudo apt install ffmpeg")
            return False
    
    @staticmethod
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
            segments: List of segment dictionaries with start/end times
            output_dir: Directory to save clips
            base_filename: Base name for output files
            save_metadata: Whether to save metadata JSON for each clip
        
        Returns:
            List of dictionaries with clip information
        """
        import json
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        results = []
        
        for idx, segment in enumerate(segments, 1):
            start_sec = segment.get('start_seconds', 0)
            end_sec = segment.get('end_seconds', 0)
            
            # Generate output filename
            clip_name = f"{base_filename}_clip{idx:02d}.mp4"
            clip_path = output_dir / clip_name
            
            print(f"Creating clip {idx}/{len(segments)}: {clip_name}")
            print(f"  Time: {segment.get('start_time', '00:00')} - {segment.get('end_time', '00:00')}")
            print(f"  Title: {segment.get('suggested_title', 'Untitled')}")
            
            # Validate segment times
            if start_sec >= end_sec:
                print(f"  ✗ ERROR: Invalid segment times (start >= end)")
                results.append({
                    'clip_path': str(clip_path),
                    'success': False,
                    'segment': segment,
                    'error': 'Invalid segment times'
                })
                continue
            
            # Slice video
            success = VideoSlicerService._slice_video(
                input_path=input_path,
                output_path=str(clip_path),
                start_time=start_sec,
                end_time=end_sec,
                padding_before=CLIP_PADDING_BEFORE,
                padding_after=CLIP_PADDING_AFTER,
                re_encode=False
            )
            
            # Verify the output file was created
            if success:
                if not clip_path.exists():
                    print(f"  ✗ ERROR: Output file was not created: {clip_path}")
                    success = False
                else:
                    file_size = clip_path.stat().st_size
                    if file_size < 1000:
                        print(f"  ✗ WARNING: Output file is suspiciously small ({file_size} bytes)")
                        success = False
                    else:
                        print(f"  ✓ Clip created successfully ({file_size / 1024 / 1024:.2f} MB)")
            
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
                    'padding_before': CLIP_PADDING_BEFORE,
                    'padding_after': CLIP_PADDING_AFTER,
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
