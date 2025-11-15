#!/usr/bin/env python3
"""
Thumbnail Generator Module
Automatically generates and enhances thumbnails from video clips
"""

import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional, Tuple, Dict
import base64
import io

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False
    print("Warning: OpenCV not available. Face detection disabled.")

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("Warning: Pillow not available. Image enhancement disabled.")

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class ThumbnailGenerator:
    """
    Generate thumbnails from video clips with automatic frame selection
    and enhancement options
    """
    
    def __init__(self, openai_api_key: Optional[str] = None):
        """
        Initialize thumbnail generator
        
        Args:
            openai_api_key: OpenAI API key for AI enhancement
        """
        self.openai_api_key = openai_api_key
        self.client = None
        
        if openai_api_key and HAS_OPENAI:
            self.client = OpenAI(api_key=openai_api_key)
    
    def extract_frames(
        self,
        video_path: str,
        num_frames: int = 8,
        output_dir: Optional[str] = None
    ) -> List[str]:
        """
        Extract frames from video at regular intervals using ffmpeg
        
        Args:
            video_path: Path to video file
            num_frames: Number of frames to extract
            output_dir: Directory to save frames (uses temp if None)
        
        Returns:
            List of paths to extracted frame images
        """
        if not Path(video_path).exists():
            raise FileNotFoundError(f"Video not found: {video_path}")
        
        # Create output directory
        if output_dir is None:
            output_dir = tempfile.mkdtemp(prefix='thumbnail_frames_')
        else:
            Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Get video duration
        duration = self._get_video_duration(video_path)
        if duration is None or duration <= 0:
            raise ValueError("Could not determine video duration")
        
        frame_paths = []
        
        # Calculate timestamps for frame extraction
        # Avoid very start and end (first/last 5% of video)
        start_offset = duration * 0.05
        end_offset = duration * 0.95
        usable_duration = end_offset - start_offset
        
        if usable_duration <= 0:
            # Video too short, just use middle
            timestamps = [duration / 2]
        else:
            # Extract frames at regular intervals
            timestamps = [
                start_offset + (usable_duration * i / (num_frames - 1))
                for i in range(num_frames)
            ]
        
        # Extract each frame
        for idx, timestamp in enumerate(timestamps):
            output_path = os.path.join(output_dir, f'frame_{idx:03d}.jpg')
            
            # Use ffmpeg to extract frame
            cmd = [
                'ffmpeg',
                '-ss', str(timestamp),
                '-i', video_path,
                '-frames:v', '1',
                '-q:v', '2',  # High quality
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
                
                if Path(output_path).exists():
                    frame_paths.append(output_path)
            
            except subprocess.CalledProcessError as e:
                print(f"Warning: Failed to extract frame at {timestamp}s: {e}")
                continue
        
        return frame_paths
    
    def select_best_frame(
        self,
        frame_paths: List[str],
        prefer_faces: bool = True
    ) -> Tuple[str, Dict]:
        """
        Analyze frames and select the best one
        
        Args:
            frame_paths: List of frame image paths
            prefer_faces: Whether to prefer frames with faces
        
        Returns:
            Tuple of (best_frame_path, analysis_info)
        """
        if not frame_paths:
            raise ValueError("No frames to analyze")
        
        if not HAS_OPENCV:
            # No OpenCV, just return middle frame
            middle_idx = len(frame_paths) // 2
            return frame_paths[middle_idx], {'method': 'middle_fallback'}
        
        best_frame = None
        best_score = -1
        analysis = []
        
        for frame_path in frame_paths:
            try:
                # Read image
                img = cv2.imread(frame_path)
                if img is None:
                    continue
                
                # Calculate sharpness (Laplacian variance)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                # Calculate brightness
                brightness = np.mean(gray)
                
                # Detect faces
                face_count = 0
                face_area = 0
                
                if prefer_faces:
                    face_count, face_area = self._detect_faces(img)
                
                # Calculate score
                # Sharpness: 0-100+ (higher is better)
                # Brightness: 0-255 (prefer 80-180 range)
                # Faces: bonus points
                
                score = sharpness / 10  # Normalize sharpness
                
                # Brightness score (penalize too dark or too bright)
                if 80 <= brightness <= 180:
                    score += 10
                elif 60 <= brightness <= 200:
                    score += 5
                
                # Face bonus
                if face_count > 0:
                    score += 20 + (face_area / (img.shape[0] * img.shape[1]) * 100)
                
                analysis.append({
                    'path': frame_path,
                    'sharpness': sharpness,
                    'brightness': brightness,
                    'faces': face_count,
                    'face_area': face_area,
                    'score': score
                })
                
                if score > best_score:
                    best_score = score
                    best_frame = frame_path
            
            except Exception as e:
                print(f"Warning: Error analyzing frame {frame_path}: {e}")
                continue
        
        if best_frame is None:
            # Fallback to middle frame
            middle_idx = len(frame_paths) // 2
            return frame_paths[middle_idx], {'method': 'fallback'}
        
        # Find the analysis for best frame
        best_analysis = next(
            (a for a in analysis if a['path'] == best_frame),
            {'method': 'analysis', 'score': best_score}
        )
        
        return best_frame, best_analysis
    
    def add_text_overlay(
        self,
        image_path: str,
        title: str,
        viral_score: Optional[float] = None,
        output_path: Optional[str] = None
    ) -> str:
        """
        Add text overlay with title and viral score badge
        
        Args:
            image_path: Path to input image
            title: Title text to add
            viral_score: Optional viral score (0-10)
            output_path: Path for output image (modifies in-place if None)
        
        Returns:
            Path to enhanced image
        """
        if not HAS_PIL:
            raise ImportError("Pillow is required for text overlay")
        
        # Load image
        img = Image.open(image_path)
        width, height = img.size
        
        # Create drawing context
        draw = ImageDraw.Draw(img, 'RGBA')
        
        # Try to load a nice font
        title_font_size = int(height * 0.08)  # 8% of image height
        score_font_size = int(height * 0.06)
        
        try:
            # Try to use a bold system font
            title_font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', title_font_size)
            score_font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', score_font_size)
        except:
            try:
                # Fallback to Arial
                title_font = ImageFont.truetype('arial.ttf', title_font_size)
                score_font = ImageFont.truetype('arial.ttf', score_font_size)
            except:
                # Use default font
                title_font = ImageFont.load_default()
                score_font = ImageFont.load_default()
        
        # Add semi-transparent overlay at top for title
        overlay_height = int(height * 0.20)
        overlay = Image.new('RGBA', (width, overlay_height), (0, 0, 0, 180))
        img.paste(overlay, (0, 0), overlay)
        
        # Wrap title text if too long
        max_chars = 35
        if len(title) > max_chars:
            title = title[:max_chars-3] + '...'
        
        # Draw title text
        # Get text bounding box for centering
        bbox = draw.textbbox((0, 0), title, font=title_font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        title_x = (width - text_width) // 2
        title_y = (overlay_height - text_height) // 2
        
        # Add text shadow for better readability
        shadow_offset = 3
        draw.text(
            (title_x + shadow_offset, title_y + shadow_offset),
            title,
            font=title_font,
            fill=(0, 0, 0, 255)
        )
        draw.text(
            (title_x, title_y),
            title,
            font=title_font,
            fill=(255, 255, 255, 255)
        )
        
        # Add viral score badge if provided
        if viral_score is not None:
            badge_size = int(height * 0.12)
            badge_margin = int(height * 0.03)
            
            # Position in top-right corner
            badge_x = width - badge_size - badge_margin
            badge_y = badge_margin
            
            # Determine badge color based on score
            if viral_score >= 8.0:
                badge_color = (34, 197, 94, 220)  # Green
            elif viral_score >= 7.0:
                badge_color = (234, 179, 8, 220)  # Yellow
            else:
                badge_color = (239, 68, 68, 220)  # Red
            
            # Draw circle badge
            draw.ellipse(
                [badge_x, badge_y, badge_x + badge_size, badge_y + badge_size],
                fill=badge_color,
                outline=(255, 255, 255, 255),
                width=3
            )
            
            # Draw score text
            score_text = f"{viral_score:.1f}"
            score_bbox = draw.textbbox((0, 0), score_text, font=score_font)
            score_width = score_bbox[2] - score_bbox[0]
            score_height = score_bbox[3] - score_bbox[1]
            
            score_x = badge_x + (badge_size - score_width) // 2
            score_y = badge_y + (badge_size - score_height) // 2
            
            draw.text(
                (score_x, score_y),
                score_text,
                font=score_font,
                fill=(255, 255, 255, 255)
            )
        
        # Apply slight sharpening for better thumbnail quality
        img = img.filter(ImageFilter.SHARPEN)
        
        # Enhance contrast slightly
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.1)
        
        # Save image
        if output_path is None:
            output_path = image_path
        
        # Convert back to RGB for JPEG
        if img.mode == 'RGBA':
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
            img = rgb_img
        
        img.save(output_path, 'JPEG', quality=95, optimize=True)
        
        return output_path
    
    def enhance_with_ai(
        self,
        image_path: str,
        title: str,
        output_path: Optional[str] = None,
        style: str = "vibrant and attention-grabbing"
    ) -> str:
        """
        Enhance thumbnail using OpenAI DALL-E
        
        Args:
            image_path: Path to input image
            title: Title for context
            output_path: Path for output image
            style: Style description for enhancement
        
        Returns:
            Path to enhanced image
        """
        if not self.client:
            raise ValueError("OpenAI client not initialized")
        
        if not HAS_PIL:
            raise ImportError("Pillow is required for AI enhancement")
        
        # Load and prepare image
        img = Image.open(image_path)
        
        # Resize to reasonable size for API (max 4MB, 1024x1024 recommended)
        max_size = 1024
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Convert to PNG for API
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Create enhancement prompt
        prompt = f"Transform this image into a vibrant, attention-grabbing YouTube thumbnail. Make it more {style}, enhance colors, improve contrast, and make it visually striking while keeping the main subject clear. Style: modern, high-energy, professional thumbnail."
        
        try:
            # Note: DALL-E 3 doesn't support image edits, so we'll use GPT-4 Vision
            # to analyze and then describe what an ideal thumbnail would look like
            # This is a placeholder - in practice, you'd want to use a different approach
            
            print("  Note: AI enhancement uses basic processing due to API limitations")
            print("  For best results, consider manual editing tools")
            
            # Apply enhanced processing instead
            # Boost saturation
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.3)
            
            # Boost contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)
            
            # Boost sharpness
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.3)
            
            # Save
            if output_path is None:
                output_path = image_path
            
            img.save(output_path, 'JPEG', quality=95, optimize=True)
            
            return output_path
        
        except Exception as e:
            print(f"Warning: AI enhancement failed: {e}")
            print("Falling back to basic enhancement")
            
            # Fallback to basic enhancement
            if output_path is None:
                output_path = image_path
            
            img.save(output_path, 'JPEG', quality=95)
            return output_path
    
    def generate_thumbnail(
        self,
        video_path: str,
        metadata: Dict,
        output_path: Optional[str] = None,
        enhancement_type: str = 'basic',
        num_frames: int = 8
    ) -> Optional[str]:
        """
        Generate thumbnail from video clip with automatic frame selection
        
        Args:
            video_path: Path to video file
            metadata: Clip metadata (should contain title, viral_score)
            output_path: Path for output thumbnail (auto-generated if None)
            enhancement_type: 'none', 'basic', or 'advanced'
            num_frames: Number of frames to analyze
        
        Returns:
            Path to generated thumbnail or None if failed
        """
        try:
            # Generate output path if not provided
            if output_path is None:
                video_path_obj = Path(video_path)
                output_path = str(video_path_obj.with_name(
                    video_path_obj.stem + '_thumbnail.jpg'
                ))
            
            # Extract frames
            print(f"  Extracting {num_frames} frames for analysis...")
            frame_paths = self.extract_frames(video_path, num_frames=num_frames)
            
            if not frame_paths:
                print("  Error: No frames extracted")
                return None
            
            print(f"  Extracted {len(frame_paths)} frames")
            
            # Select best frame
            print("  Analyzing frames to select best thumbnail...")
            best_frame, analysis = self.select_best_frame(frame_paths)
            print(f"  Selected frame with score: {analysis.get('score', 'N/A')}")
            
            # Copy best frame to output location
            import shutil
            shutil.copy(best_frame, output_path)
            
            # Apply enhancement
            title = metadata.get('suggested_title', 'Viral Clip')
            viral_score = metadata.get('viral_score')
            
            if enhancement_type == 'basic':
                print("  Applying basic enhancement with text overlay...")
                output_path = self.add_text_overlay(
                    output_path,
                    title,
                    viral_score
                )
            
            elif enhancement_type == 'advanced':
                print("  Applying AI enhancement...")
                # First add text overlay
                output_path = self.add_text_overlay(
                    output_path,
                    title,
                    viral_score
                )
                # Then apply AI enhancement
                output_path = self.enhance_with_ai(
                    output_path,
                    title
                )
            
            # Clean up temporary frames
            for frame_path in frame_paths:
                try:
                    Path(frame_path).unlink()
                except:
                    pass
            
            print(f"  ✓ Thumbnail saved: {output_path}")
            return output_path
        
        except Exception as e:
            print(f"  Error generating thumbnail: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _get_video_duration(self, video_path: str) -> Optional[float]:
        """Get video duration in seconds using ffprobe"""
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
    
    def _detect_faces(self, img) -> Tuple[int, float]:
        """
        Detect faces in image using OpenCV Haar Cascades
        
        Returns:
            Tuple of (face_count, total_face_area)
        """
        if not HAS_OPENCV:
            return 0, 0.0
        
        try:
            # Load Haar Cascade for face detection
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Calculate total face area
            total_area = sum(w * h for (x, y, w, h) in faces)
            
            return len(faces), float(total_area)
        
        except Exception as e:
            print(f"Warning: Face detection failed: {e}")
            return 0, 0.0


def generate_thumbnail_for_clip(
    video_path: str,
    metadata_path: str,
    enhancement_type: str = 'basic',
    openai_api_key: Optional[str] = None
) -> Optional[str]:
    """
    Convenience function to generate thumbnail for a clip
    
    Args:
        video_path: Path to video clip
        metadata_path: Path to metadata JSON file
        enhancement_type: 'none', 'basic', or 'advanced'
        openai_api_key: OpenAI API key (required for advanced)
    
    Returns:
        Path to generated thumbnail or None
    """
    import json
    
    # Load metadata
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        print(f"Error loading metadata: {e}")
        return None
    
    # Create generator
    generator = ThumbnailGenerator(openai_api_key=openai_api_key)
    
    # Generate thumbnail
    return generator.generate_thumbnail(
        video_path=video_path,
        metadata=metadata,
        enhancement_type=enhancement_type
    )

