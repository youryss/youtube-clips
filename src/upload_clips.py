#!/usr/bin/env python3
"""
Upload Clips CLI
Command-line tool to upload generated viral clips to social media platforms
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Optional
from tqdm import tqdm

# Import configuration
import config
from uploaders.youtube import YouTubeUploader
from thumbnail_generator import ThumbnailGenerator


def find_clips(output_dir: Path, video_name: Optional[str] = None) -> List[tuple[Path, Path]]:
    """
    Find all video clips and their metadata in the output directory
    
    Args:
        output_dir: Output directory path
        video_name: Optional video name to filter by
    
    Returns:
        List of (video_path, metadata_path) tuples
    """
    clips = []
    
    for video_folder in output_dir.iterdir():
        if not video_folder.is_dir():
            continue
        
        # Filter by video name if specified
        if video_name and video_name.lower() not in video_folder.name.lower():
            continue
        
        # Find all clip files in this folder
        for video_file in video_folder.glob('*_clip*.mp4'):
            # Find corresponding metadata file
            metadata_file = video_file.with_name(video_file.stem + '_metadata.json')
            
            if metadata_file.exists():
                clips.append((video_file, metadata_file))
            else:
                print(f"⚠️  Warning: No metadata found for {video_file.name}")
    
    return clips


def list_available_videos(output_dir: Path) -> List[str]:
    """
    List all available video folders in output directory
    
    Args:
        output_dir: Output directory path
    
    Returns:
        List of video folder names
    """
    videos = []
    for video_folder in output_dir.iterdir():
        if video_folder.is_dir():
            # Count clips in this folder
            clip_count = len(list(video_folder.glob('*_clip*.mp4')))
            if clip_count > 0:
                videos.append((video_folder.name, clip_count))
    
    return videos


def display_clip_info(video_path: Path, metadata: Dict, index: int):
    """
    Display information about a clip
    
    Args:
        video_path: Path to video file
        metadata: Clip metadata
        index: Clip index number
    """
    print(f"\n📹 Clip #{index}")
    print(f"   File: {video_path.name}")
    print(f"   Title: {metadata.get('suggested_title', 'N/A')}")
    print(f"   Duration: {metadata.get('duration_seconds', 'N/A')}s")
    print(f"   Score: {metadata.get('viral_score', 'N/A')}/10")
    print(f"   Time: {metadata.get('start_time', 'N/A')} - {metadata.get('end_time', 'N/A')}")
    if 'criteria_matched' in metadata:
        print(f"   Criteria: {', '.join(metadata['criteria_matched'])}")


def interactive_select_clips(clips: List[tuple[Path, Path]]) -> List[tuple[Path, Path]]:
    """
    Let user interactively select which clips to upload
    
    Args:
        clips: List of (video_path, metadata_path) tuples
    
    Returns:
        Selected clips
    """
    print("\n" + "=" * 70)
    print("Available Clips")
    print("=" * 70)
    
    # Display all clips with details
    for i, (video_path, metadata_path) in enumerate(clips, 1):
        metadata = load_metadata(metadata_path)
        if metadata:
            display_clip_info(video_path, metadata, i)
    
    print("\n" + "=" * 70)
    print("Select clips to upload:")
    print("  • Enter clip numbers separated by commas (e.g., 1,3,5)")
    print("  • Enter 'all' to upload all clips")
    print("  • Enter 'none' or 'q' to cancel")
    print("=" * 70)
    
    while True:
        selection = input("\nYour selection: ").strip().lower()
        
        if selection in ['none', 'q', 'quit', 'exit']:
            return []
        
        if selection == 'all':
            return clips
        
        try:
            # Parse comma-separated numbers
            indices = [int(x.strip()) for x in selection.split(',')]
            
            # Validate indices
            if all(1 <= i <= len(clips) for i in indices):
                selected = [clips[i-1] for i in indices]
                print(f"\n✓ Selected {len(selected)} clip(s)")
                return selected
            else:
                print(f"❌ Invalid selection. Please enter numbers between 1 and {len(clips)}")
        except ValueError:
            print("❌ Invalid input. Please enter numbers separated by commas, or 'all'")


def select_video_interactively(output_dir: Path) -> Optional[str]:
    """
    Let user select which video's clips to upload
    
    Args:
        output_dir: Output directory path
    
    Returns:
        Selected video name or None
    """
    videos = list_available_videos(output_dir)
    
    if not videos:
        print("❌ No videos found with clips!")
        return None
    
    print("\n" + "=" * 70)
    print("Available Videos")
    print("=" * 70)
    
    for i, (video_name, clip_count) in enumerate(videos, 1):
        print(f"{i}. {video_name}")
        print(f"   ({clip_count} clip{'s' if clip_count != 1 else ''})")
    
    print("\n" + "=" * 70)
    print("Select a video:")
    print("  • Enter the video number")
    print("  • Enter 'all' to see clips from all videos")
    print("  • Enter 'q' to cancel")
    print("=" * 70)
    
    while True:
        selection = input("\nYour selection: ").strip().lower()
        
        if selection in ['q', 'quit', 'exit']:
            return None
        
        if selection == 'all':
            return 'all'
        
        try:
            index = int(selection)
            if 1 <= index <= len(videos):
                return videos[index-1][0]
            else:
                print(f"❌ Invalid selection. Please enter a number between 1 and {len(videos)}")
        except ValueError:
            print("❌ Invalid input. Please enter a number or 'all'")


def load_metadata(metadata_path: Path) -> Optional[Dict]:
    """
    Load clip metadata from JSON file
    
    Args:
        metadata_path: Path to metadata file
    
    Returns:
        Metadata dictionary or None if failed
    """
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading metadata from {metadata_path}: {e}")
        return None


def format_description(metadata: Dict, include_source: bool = True) -> str:
    """
    Format video description from metadata
    
    Args:
        metadata: Clip metadata
        include_source: Whether to include source video info
    
    Returns:
        Formatted description string
    """
    parts = []
    
    # Add reasoning/explanation
    if 'reasoning' in metadata:
        parts.append(metadata['reasoning'])
        parts.append("")  # Empty line
    
    # Add matched criteria
    if 'criteria_matched' in metadata:
        criteria_text = "Viral Elements: " + ", ".join(
            f"#{c.replace('_', '').title()}"
            for c in metadata['criteria_matched']
        )
        parts.append(criteria_text)
        parts.append("")
    
    # Add source info
    if include_source and 'source_video' in metadata:
        source_name = Path(metadata['source_video']).stem
        parts.append(f"From: {source_name}")
    
    # Add timestamps
    if 'start_time' in metadata and 'end_time' in metadata:
        parts.append(f"Clip: {metadata['start_time']} - {metadata['end_time']}")
    
    return "\n".join(parts)


def get_tags_from_metadata(metadata: Dict, base_tags: List[str]) -> List[str]:
    """
    Generate tags from metadata
    
    Args:
        metadata: Clip metadata
        base_tags: Base tags to always include
    
    Returns:
        List of tags
    """
    tags = base_tags.copy()
    
    # Add criteria as tags
    if 'criteria_matched' in metadata:
        for criterion in metadata['criteria_matched']:
            # Convert snake_case to tag
            tag = criterion.replace('_', '').title()
            if tag not in tags:
                tags.append(tag)
    
    return tags


def upload_to_youtube(
    clips: List[tuple[Path, Path]],
    uploader: YouTubeUploader,
    privacy: str = 'private',
    make_shorts: bool = True,
    base_tags: Optional[List[str]] = None,
    dry_run: bool = False,
    thumbnail_mode: str = 'none',
    thumbnail_frames: int = 8,
    openai_api_key: Optional[str] = None
) -> Dict[str, int]:
    """
    Upload clips to YouTube
    
    Args:
        clips: List of (video_path, metadata_path) tuples
        uploader: YouTubeUploader instance
        privacy: Privacy status (private, unlisted, public)
        make_shorts: Whether to upload as YouTube Shorts
        base_tags: Base tags to include
        dry_run: If True, don't actually upload
        thumbnail_mode: Thumbnail generation mode ('none', 'basic', 'advanced')
        thumbnail_frames: Number of frames to analyze for thumbnail
        openai_api_key: OpenAI API key for advanced thumbnails
    
    Returns:
        Dictionary with upload statistics
    """
    if base_tags is None:
        base_tags = ['Shorts', 'Viral', 'AI']
    
    stats = {
        'total': len(clips),
        'success': 0,
        'failed': 0,
        'skipped': 0
    }
    
    # Authenticate first
    if not dry_run:
        print("\n🔐 Authenticating with YouTube...")
        if not uploader.authenticate():
            print("❌ Authentication failed!")
            return stats
    
    print(f"\n📤 Uploading {len(clips)} clip(s) to YouTube...")
    print(f"   Privacy: {privacy}")
    print(f"   As Shorts: {make_shorts}")
    if thumbnail_mode != 'none':
        print(f"   Thumbnails: {thumbnail_mode}")
    print("=" * 70)
    
    # Initialize thumbnail generator if needed
    thumbnail_generator = None
    if thumbnail_mode != 'none':
        thumbnail_generator = ThumbnailGenerator(openai_api_key=openai_api_key)
    
    # Upload each clip
    with tqdm(total=len(clips), desc="Upload Progress", unit="video") as pbar:
        for video_path, metadata_path in clips:
            pbar.write(f"\n📹 {video_path.name}")
            
            # Load metadata
            metadata = load_metadata(metadata_path)
            if not metadata:
                pbar.write(f"  ⚠️  Skipping: Could not load metadata")
                stats['skipped'] += 1
                pbar.update(1)
                continue
            
            # Prepare upload parameters
            title = metadata.get('suggested_title', video_path.stem)
            description = format_description(metadata)
            tags = get_tags_from_metadata(metadata, base_tags)
            
            pbar.write(f"  Title: {title}")
            pbar.write(f"  Tags: {', '.join(tags[:5])}")
            
            # Generate thumbnail if requested
            thumbnail_path = None
            if thumbnail_generator and thumbnail_mode != 'none':
                pbar.write(f"  Generating {thumbnail_mode} thumbnail...")
                try:
                    thumbnail_path = thumbnail_generator.generate_thumbnail(
                        video_path=str(video_path),
                        metadata=metadata,
                        enhancement_type=thumbnail_mode,
                        num_frames=thumbnail_frames
                    )
                    if thumbnail_path:
                        pbar.write(f"  ✓ Thumbnail generated")
                    else:
                        pbar.write(f"  ⚠️ Thumbnail generation failed")
                except Exception as e:
                    pbar.write(f"  ⚠️ Thumbnail error: {e}")
            
            if dry_run:
                pbar.write(f"  ✓ [DRY RUN] Would upload to YouTube")
                stats['success'] += 1
            else:
                # Upload
                result = uploader.upload_video(
                    video_path=str(video_path),
                    title=title,
                    description=description,
                    tags=tags,
                    privacy=privacy,
                    make_shorts=make_shorts,
                    thumbnail_path=thumbnail_path
                )
                
                if result.success:
                    pbar.write(f"  ✓ Uploaded: {result.url}")
                    stats['success'] += 1
                else:
                    pbar.write(f"  ✗ Failed: {result.error}")
                    stats['failed'] += 1
            
            pbar.update(1)
    
    return stats


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Upload viral clips to social media platforms'
    )
    
    parser.add_argument(
        '--platform',
        choices=['youtube', 'tiktok', 'instagram', 'twitter', 'all'],
        default='youtube',
        help='Platform to upload to (default: youtube)'
    )
    
    parser.add_argument(
        '--privacy',
        choices=['private', 'unlisted', 'public'],
        default='private',
        help='Privacy status for YouTube uploads (default: private)'
    )
    
    parser.add_argument(
        '--no-shorts',
        action='store_true',
        help='Don\'t optimize for YouTube Shorts'
    )
    
    parser.add_argument(
        '--tags',
        type=str,
        help='Comma-separated list of additional tags'
    )
    
    parser.add_argument(
        '--output-dir',
        type=str,
        default=None,
        help='Output directory containing clips (default: from config)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be uploaded without actually uploading'
    )
    
    parser.add_argument(
        '--interactive', '-i',
        action='store_true',
        help='Interactively select which clips to upload'
    )
    
    parser.add_argument(
        '--video',
        type=str,
        help='Only process clips from this video (partial name match)'
    )
    
    parser.add_argument(
        '--clips',
        type=str,
        help='Comma-separated clip numbers to upload (e.g., 1,3,5)'
    )
    
    parser.add_argument(
        '--filter',
        type=str,
        help='Only upload clips containing this string in the filename'
    )
    
    parser.add_argument(
        '--thumbnail',
        '--thumbnail-mode',
        choices=['none', 'basic', 'advanced'],
        default='none',
        help='Generate thumbnails: none (no thumbnail), basic (text overlay), advanced (AI enhanced)'
    )
    
    parser.add_argument(
        '--thumbnail-frames',
        type=int,
        default=8,
        help='Number of frames to analyze for thumbnail selection (default: 8)'
    )
    
    args = parser.parse_args()
    
    # Print banner
    print("=" * 70)
    print("YouTube Viral Clipper - Upload Tool")
    print("=" * 70)
    
    # Get output directory
    output_dir = Path(args.output_dir) if args.output_dir else config.OUTPUT_PATH
    if not output_dir.exists():
        print(f"❌ Output directory not found: {output_dir}")
        sys.exit(1)
    
    # Interactive video selection
    video_filter = args.video
    if args.interactive and not video_filter:
        video_filter = select_video_interactively(output_dir)
        if video_filter is None:
            print("Upload cancelled.")
            sys.exit(0)
        if video_filter == 'all':
            video_filter = None
    
    # Find clips
    print(f"\n🔍 Scanning for clips in: {output_dir}")
    if video_filter:
        print(f"   Filtering by video: {video_filter}")
    
    all_clips = find_clips(output_dir, video_name=video_filter)
    
    # Apply additional filter if specified
    if args.filter:
        all_clips = [
            (v, m) for v, m in all_clips
            if args.filter.lower() in v.name.lower()
        ]
        print(f"   Filtered to clips containing: '{args.filter}'")
    
    if not all_clips:
        print("❌ No clips found!")
        sys.exit(1)
    
    print(f"✓ Found {len(all_clips)} clip(s)")
    
    # Interactive clip selection or filter by clip numbers
    if args.interactive:
        all_clips = interactive_select_clips(all_clips)
        if not all_clips:
            print("No clips selected. Exiting.")
            sys.exit(0)
    elif args.clips:
        try:
            clip_indices = [int(x.strip()) for x in args.clips.split(',')]
            all_clips = [all_clips[i-1] for i in clip_indices if 1 <= i <= len(all_clips)]
            print(f"✓ Selected {len(all_clips)} specific clip(s)")
        except (ValueError, IndexError) as e:
            print(f"❌ Invalid clip numbers: {args.clips}")
            sys.exit(1)
    
    # Parse additional tags
    base_tags = ['Shorts', 'Viral', 'AI']
    if args.tags:
        base_tags.extend(tag.strip() for tag in args.tags.split(','))
    
    # Upload based on platform
    if args.platform == 'youtube' or args.platform == 'all':
        # Initialize YouTube uploader
        client_secrets = os.getenv('YOUTUBE_CLIENT_SECRETS_FILE', 'client_secrets.json')
        token_file = os.getenv('YOUTUBE_TOKEN_FILE', 'youtube_token.json')
        
        uploader = YouTubeUploader(
            client_secrets_file=client_secrets,
            token_file=token_file,
            default_privacy=args.privacy
        )
        
        # Get OpenAI API key for advanced thumbnails
        openai_api_key = None
        if args.thumbnail == 'advanced':
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                print("⚠️ Warning: OPENAI_API_KEY not set. Advanced thumbnails will use basic enhancement.")
        
        # Upload
        stats = upload_to_youtube(
            clips=all_clips,
            uploader=uploader,
            privacy=args.privacy,
            make_shorts=not args.no_shorts,
            base_tags=base_tags,
            dry_run=args.dry_run,
            thumbnail_mode=args.thumbnail,
            thumbnail_frames=args.thumbnail_frames,
            openai_api_key=openai_api_key
        )
        
        # Print summary
        print("\n" + "=" * 70)
        print("Upload Complete!")
        print("=" * 70)
        print(f"Total clips: {stats['total']}")
        print(f"✓ Successful: {stats['success']}")
        print(f"✗ Failed: {stats['failed']}")
        print(f"⊘ Skipped: {stats['skipped']}")
        
        if args.dry_run:
            print("\n💡 This was a dry run. Use without --dry-run to actually upload.")
    
    elif args.platform in ['tiktok', 'instagram', 'twitter']:
        print(f"\n⚠️  {args.platform.title()} upload not yet implemented.")
        print("Currently only YouTube is supported.")
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Upload interrupted by user. Exiting...")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

