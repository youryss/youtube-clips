#!/usr/bin/env python3
"""
YouTube Viral Clipper - Main CLI Application
Downloads videos, transcribes them, analyzes for viral content, and creates clips
"""

import sys
import time
from pathlib import Path
from typing import List
from tqdm import tqdm

# Import local modules
import config
from download import download_video, get_video_info
from transcribe import download_audio, transcribe_with_timestamps, sanitize_filename
from analyzer import analyze_transcript, format_segment_summary
from slicer import slice_video_batch, get_video_duration


def read_video_urls(filename: str = 'videos.txt') -> List[str]:
    """
    Read YouTube URLs from input file
    
    Args:
        filename: Path to file containing URLs
    
    Returns:
        List of URLs
    """
    urls = []
    filepath = config.PROJECT_ROOT / filename
    
    if not filepath.exists():
        print(f"Error: {filename} not found!")
        return urls
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Skip empty lines and comments
            if line and not line.startswith('#'):
                urls.append(line)
    
    return urls


def process_video(url: str, progress_bar: tqdm = None) -> dict:
    """
    Process a single video through the entire pipeline
    
    Args:
        url: YouTube video URL
        progress_bar: Optional tqdm progress bar for status updates
    
    Returns:
        Dictionary with processing results
    """
    result = {
        'url': url,
        'success': False,
        'clips_created': 0,
        'error': None
    }
    
    def update_status(message: str):
        if progress_bar:
            progress_bar.write(f"  {message}")
        else:
            print(f"  {message}")
    
    try:
        # Step 1: Get video info
        update_status("Getting video information...")
        video_info = get_video_info(url)
        
        if not video_info:
            result['error'] = "Failed to get video info"
            return result
        
        title = video_info['title']
        result['title'] = title
        sanitized_title = sanitize_filename(title)
        
        update_status(f"Processing: {title[:60]}...")
        
        # Step 2: Download video
        update_status("Downloading video...")
        video_data = download_video(
            url=url,
            output_dir=str(config.TEMP_PATH),
            quality=config.VIDEO_QUALITY,
            filename=sanitized_title
        )
        
        if not video_data:
            result['error'] = "Failed to download video"
            return result
        
        video_path = video_data['path']
        
        if video_data.get('cached'):
            update_status("Using cached video")
        else:
            update_status("Video downloaded successfully")
        
        # Step 3: Download audio and transcribe
        update_status("Checking for audio file...")
        audio_path = download_audio(
            url=url,
            output_path=str(config.TEMP_PATH / f"{sanitized_title}_audio"),
            audio_format="mp3"
        )
        
        if not audio_path:
            result['error'] = "Failed to download/find audio"
            return result
        
        # Transcribe (will show its own progress)
        transcript_cache_path = config.TEMP_PATH / f"{sanitized_title}_transcript.json"
        transcript_segments = transcribe_with_timestamps(
            audio_path=audio_path,
            model_name=config.WHISPER_MODEL,
            device=config.WHISPER_DEVICE,
            compute_type=config.WHISPER_COMPUTE_TYPE,
            cache_path=str(transcript_cache_path),
            show_progress=True
        )
        
        if not transcript_segments:
            result['error'] = "Failed to transcribe audio"
            return result
        
        # Step 4: Analyze transcript for viral segments
        update_status("Analyzing transcript with AI...")
        viral_segments = analyze_transcript(
            transcript_segments=transcript_segments,
            verbose=False
        )
        
        if not viral_segments:
            result['error'] = "No viral segments identified"
            update_status("⚠️  No clips met the viral criteria")
            return result
        
        update_status(f"Found {len(viral_segments)} viral segments")
        
        # Print segment summaries
        for i, seg in enumerate(viral_segments, 1):
            update_status(f"\nClip {i}:")
            for line in format_segment_summary(seg).split('\n'):
                update_status(f"  {line}")
        
        # Step 5: Create video clips
        update_status(f"\nCreating {len(viral_segments)} video clips...")
        
        clip_results = slice_video_batch(
            input_path=video_path,
            segments=viral_segments,
            output_dir=str(config.OUTPUT_PATH / sanitized_title),
            base_filename=sanitized_title,
            save_metadata=True
        )
        
        # Count successful clips
        successful_clips = sum(1 for r in clip_results if r['success'])
        result['clips_created'] = successful_clips
        result['success'] = successful_clips > 0
        
        update_status(f"\n✓ Created {successful_clips}/{len(viral_segments)} clips")
        
        # Cleanup temporary audio file
        try:
            Path(audio_path).unlink()
        except:
            pass
        
        return result
    
    except Exception as e:
        result['error'] = str(e)
        update_status(f"✗ Error: {e}")
        return result


def print_banner():
    """Print application banner"""
    print("=" * 70)
    print("YouTube Viral Clipper")
    print("AI-Powered Viral Clip Generator")
    print("=" * 70)


def print_config_summary():
    """Print configuration summary"""
    print("\nConfiguration:")
    print(f"  • Whisper Model: {config.WHISPER_MODEL}")
    print(f"  • OpenAI Model: {config.OPENAI_MODEL}")
    print(f"  • Video Quality: {config.VIDEO_QUALITY}")
    print(f"  • Clip Duration: {config.MIN_CLIP_DURATION}-{config.MAX_CLIP_DURATION}s")
    print(f"  • Max Clips per Video: {config.MAX_CLIPS_PER_VIDEO}")
    print(f"  • Min Viral Score: {config.MIN_VIRAL_SCORE}/10")
    print(f"  • Active Criteria: {', '.join(config.ACTIVE_CRITERIA)}")
    print(f"  • Output Directory: {config.OUTPUT_PATH}")


def main():
    """Main application entry point"""
    print_banner()
    
    # Validate configuration
    if not config.validate_config():
        print("\n❌ Configuration error. Please check your .env file.")
        print("Make sure OPENAI_API_KEY is set.")
        sys.exit(1)
    
    print_config_summary()
    
    # Read video URLs
    print("\n" + "=" * 70)
    urls = read_video_urls()
    
    if not urls:
        print("\n❌ No URLs found in videos.txt")
        print("Please add YouTube URLs (one per line) to videos.txt")
        sys.exit(1)
    
    print(f"\nFound {len(urls)} video(s) to process")
    
    # Process videos
    print("\n" + "=" * 70)
    print("Starting processing...")
    print("=" * 70 + "\n")
    
    results = []
    start_time = time.time()
    
    # Process each video with progress tracking
    with tqdm(total=len(urls), desc="Overall Progress", unit="video") as pbar:
        for url in urls:
            pbar.write(f"\n{'=' * 70}")
            pbar.write(f"Processing: {url}")
            pbar.write('=' * 70)
            
            result = process_video(url, pbar)
            results.append(result)
            
            pbar.update(1)
    
    # Print summary
    elapsed_time = time.time() - start_time
    successful = sum(1 for r in results if r['success'])
    total_clips = sum(r['clips_created'] for r in results)
    
    print("\n" + "=" * 70)
    print("Processing Complete!")
    print("=" * 70)
    print(f"\nTotal Videos: {len(urls)}")
    print(f"✓ Successful: {successful}")
    print(f"✗ Failed: {len(urls) - successful}")
    print(f"🎬 Total Clips Created: {total_clips}")
    print(f"\n⏱️  Time Elapsed: {elapsed_time:.1f}s ({elapsed_time/60:.1f} minutes)")
    
    if successful > 0:
        print(f"⏱️  Average Time per Video: {elapsed_time/successful:.1f}s")
    
    print(f"\n📁 Clips saved to: {config.OUTPUT_PATH}")
    
    # Print details for failed videos
    failed_results = [r for r in results if not r['success']]
    if failed_results:
        print("\n⚠️  Failed Videos:")
        for r in failed_results:
            title = r.get('title', 'Unknown')
            error = r.get('error', 'Unknown error')
            print(f"  • {title[:50]}: {error}")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user. Exiting...")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

