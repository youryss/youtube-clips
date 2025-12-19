#!/usr/bin/env python3
"""
Transcription Service
Service for downloading audio and transcribing with Whisper
"""

import re
import json
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Optional, Callable

import yt_dlp
from faster_whisper import WhisperModel

from .processing_config import (
    WHISPER_MODEL,
    WHISPER_DEVICE,
    WHISPER_COMPUTE_TYPE,
    TEMP_PATH
)
from .ytdlp_utils import create_ytdlp_instance


class TranscriptionService:
    """Service for audio transcription"""
    
    # Class-level model instance for preloading
    _model: Optional[WhisperModel] = None
    _model_config: Optional[Dict[str, str]] = None
    
    @classmethod
    def initialize_model(
        cls,
        model_name: Optional[str] = None,
        device: Optional[str] = None,
        compute_type: Optional[str] = None
    ) -> None:
        """
        Preload the Whisper model at application startup
        
        Args:
            model_name: Whisper model size (defaults to WHISPER_MODEL)
            device: Device to use (defaults to WHISPER_DEVICE)
            compute_type: Compute type (defaults to WHISPER_COMPUTE_TYPE)
        """
        if cls._model is not None:
            print("[Transcribe] Model already initialized, skipping...", flush=True)
            return
        
        model_name = model_name or WHISPER_MODEL
        device = device or WHISPER_DEVICE
        compute_type = compute_type or WHISPER_COMPUTE_TYPE
        
        print(f"[Transcribe] Preloading Whisper model: {model_name} (device={device}, compute_type={compute_type})", flush=True)
        start_time = time.time()
        
        try:
            cls._model = WhisperModel(model_name, device=device, compute_type=compute_type)
            cls._model_config = {
                'model_name': model_name,
                'device': device,
                'compute_type': compute_type
            }
            load_time = time.time() - start_time
            print(f"[Transcribe] Model preloaded successfully in {load_time:.2f} seconds", flush=True)
        except ImportError as e:
            error_msg = f"Failed to import faster_whisper: {e}"
            print(f"[Transcribe] ERROR: {error_msg}", flush=True)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Failed to preload Whisper model: {e}"
            print(f"[Transcribe] ERROR: {error_msg}", flush=True)
            import traceback
            traceback.print_exc()
            raise Exception(error_msg)
    
    @classmethod
    def get_model(
        cls,
        model_name: Optional[str] = None,
        device: Optional[str] = None,
        compute_type: Optional[str] = None
    ) -> WhisperModel:
        """
        Get the Whisper model instance, loading it if not already loaded
        
        Args:
            model_name: Whisper model size (defaults to WHISPER_MODEL)
            device: Device to use (defaults to WHISPER_DEVICE)
            compute_type: Compute type (defaults to WHISPER_COMPUTE_TYPE)
        
        Returns:
            WhisperModel instance
        """
        model_name = model_name or WHISPER_MODEL
        device = device or WHISPER_DEVICE
        compute_type = compute_type or WHISPER_COMPUTE_TYPE
        
        # If model is already loaded and config matches, reuse it
        if cls._model is not None and cls._model_config:
            if (cls._model_config['model_name'] == model_name and
                cls._model_config['device'] == device and
                cls._model_config['compute_type'] == compute_type):
                return cls._model
        
        # Otherwise, load a new model (fallback for different configs)
        print(f"[Transcribe] Loading Whisper model: {model_name} (device={device}, compute_type={compute_type})", flush=True)
        start_time = time.time()
        
        try:
            model = WhisperModel(model_name, device=device, compute_type=compute_type)
            load_time = time.time() - start_time
            print(f"[Transcribe] Model loaded successfully in {load_time:.2f} seconds", flush=True)
            return model
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
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Remove invalid characters from filename"""
        sanitized = re.sub(r'[/\\:*?"<>|]', '_', filename)
        sanitized = sanitized.strip('. ')
        if len(sanitized) > 200:
            sanitized = sanitized[:200]
        return sanitized
    
    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """Convert seconds to HH:MM:SS or MM:SS format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes:02d}:{secs:02d}"
    
    @staticmethod
    def download_audio(
        url: str,
        output_path: Optional[str] = None,
        audio_format: str = "mp3"
    ) -> Optional[str]:
        """
        Download audio from YouTube video
        
        Args:
            url: YouTube video URL
            output_path: Path where audio should be saved (without extension)
            audio_format: Audio format (mp3, m4a, etc.)
        
        Returns:
            Path to downloaded audio file, or None if failed
        """
        if output_path is None:
            output_path = str(TEMP_PATH / "audio_temp")
        
        # Check if audio already exists
        for ext in ['.mp3', '.m4a', '.webm', '.opus']:
            potential_file = Path(f"{output_path}{ext}")
            if potential_file.exists():
                return str(potential_file)
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': audio_format,
                'preferredquality': '192',
            }],
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
        }
        
        try:
            ydl = create_ytdlp_instance(ydl_opts)
            try:
                ydl.download([url])
            finally:
                try:
                    ydl.close()
                except OSError:
                    pass
            
            # Find the downloaded audio file
            for ext in ['.mp3', '.m4a', '.webm', '.opus']:
                potential_file = Path(f"{output_path}{ext}")
                if potential_file.exists():
                    return str(potential_file)
            
            return None
        except Exception as e:
            print(f"Error downloading audio: {e}")
            return None
    
    @staticmethod
    def _get_audio_duration(audio_path: str) -> Optional[float]:
        """Get duration of audio file in seconds"""
        try:
            result = subprocess.run(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                 '-of', 'default=noprint_wrappers=1:nokey=1', audio_path],
                capture_output=True,
                text=True
            )
            return float(result.stdout.strip())
        except Exception:
            return None
    
    @staticmethod
    def _save_transcript_cache(transcript_segments: List[Dict], cache_path: str) -> bool:
        """Save transcript segments to a JSON cache file"""
        try:
            cache_path = Path(cache_path)
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(transcript_segments, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Warning: Could not save transcript cache: {e}")
            return False
    
    @staticmethod
    def _load_transcript_cache(cache_path: str) -> Optional[List[Dict]]:
        """Load transcript segments from a JSON cache file"""
        try:
            cache_path = Path(cache_path)
            if not cache_path.exists():
                return None
            
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list) and len(data) > 0:
                if all(isinstance(item, dict) and 'start' in item and 'text' in item for item in data):
                    return data
            
            return None
        except Exception as e:
            print(f"Warning: Could not load transcript cache: {e}")
            return None
    
    @staticmethod
    def transcribe_with_timestamps(
        audio_path: str,
        model_name: Optional[str] = None,
        device: Optional[str] = None,
        compute_type: Optional[str] = None,
        cache_path: Optional[str] = None,
        show_progress: bool = True,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> List[Dict]:
        """
        Transcribe audio using Whisper
        
        Args:
            audio_path: Path to audio file
            model_name: Whisper model size (defaults to WHISPER_MODEL)
            device: Device to use (defaults to WHISPER_DEVICE)
            compute_type: Compute type (defaults to WHISPER_COMPUTE_TYPE)
            cache_path: Optional path to save/load transcript cache
            show_progress: Whether to show progress
            progress_callback: Optional callback for progress updates
        
        Returns:
            List of transcript segments with timestamps
        """
        model_name = model_name or WHISPER_MODEL
        device = device or WHISPER_DEVICE
        compute_type = compute_type or WHISPER_COMPUTE_TYPE
        
        # Try to load from cache first
        if cache_path:
            cached_transcript = TranscriptionService._load_transcript_cache(cache_path)
            if cached_transcript:
                if progress_callback:
                    progress_callback(100)
                return cached_transcript
        
        # Get audio duration for progress tracking
        audio_duration = TranscriptionService._get_audio_duration(audio_path) if show_progress else None
        
        if show_progress:
            print("Transcribing audio...", flush=True)
            if audio_duration:
                print(f"Audio duration: {TranscriptionService.format_timestamp(audio_duration)}", flush=True)
        
        if progress_callback:
            try:
                progress_callback(0)
            except:
                pass
        
        # Get model instance (will use preloaded model if available)
        model = TranscriptionService.get_model(model_name, device, compute_type)
        
        print(f"[Transcribe] Starting transcription of: {audio_path}", flush=True)
        
        try:
            segments_data, info = model.transcribe(audio_path, beam_size=5)
        except Exception as e:
            print(f"[Transcribe] ERROR in model.transcribe(): {e}", flush=True)
            import traceback
            traceback.print_exc()
            raise
        
        if progress_callback and audio_duration and audio_duration > 0:
            progress_callback(0)
        
        result = []
        last_print_time = 0
        last_callback_time = 0
        segment_count = 0
        
        try:
            for segment in segments_data:
                segment_count += 1
                
                result.append({
                    'start': segment.start,
                    'end': segment.end,
                    'text': segment.text.strip(),
                    'start_formatted': TranscriptionService.format_timestamp(segment.start),
                    'end_formatted': TranscriptionService.format_timestamp(segment.end)
                })
                
                # Calculate progress percentage
                if audio_duration and audio_duration > 0:
                    progress_pct = min(100, int((segment.end / audio_duration) * 100))
                else:
                    progress_pct = 0
                
                # Update progress callback
                should_update_callback = False
                if audio_duration and audio_duration > 0:
                    if segment_count <= 10 or segment.end - last_callback_time >= 0.3 or len(result) % 2 == 0:
                        should_update_callback = True
                else:
                    if len(result) % 2 == 0:
                        should_update_callback = True
                
                if should_update_callback and progress_callback:
                    if audio_duration and audio_duration > 0:
                        progress_callback(progress_pct)
                        last_callback_time = segment.end
                    else:
                        estimated_pct = min(95, int((len(result) / 100) * 100))
                        progress_callback(estimated_pct)
                
                # Print progress less frequently
                if segment.end - last_print_time >= 2:
                    if show_progress:
                        if audio_duration and audio_duration > 0:
                            print(f"  Progress: {progress_pct}% - {TranscriptionService.format_timestamp(segment.end)} / {TranscriptionService.format_timestamp(audio_duration)} - {len(result)} segments", flush=True)
                        else:
                            print(f"  Progress: {TranscriptionService.format_timestamp(segment.end)} - {len(result)} segments", flush=True)
                    last_print_time = segment.end
        except Exception as e:
            print(f"[Transcribe] ERROR in transcription loop: {e}", flush=True)
            import traceback
            traceback.print_exc()
            raise
        
        # Final progress update
        if progress_callback and audio_duration and audio_duration > 0:
            progress_callback(100)
        
        if show_progress:
            print(f"  ✓ Transcription complete: {len(result)} segments", flush=True)
        
        # Save to cache if path provided
        if cache_path and result:
            TranscriptionService._save_transcript_cache(result, cache_path)
        
        return result
