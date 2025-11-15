#!/usr/bin/env python3
"""
Video Processor Service
Wraps existing CLI modules for video processing
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import from src/
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from src import config as cli_config
from src.download import download_video, get_video_info
from src.transcribe import download_audio, transcribe_with_timestamps, sanitize_filename
from src.analyzer import analyze_transcript
from src.slicer import slice_video_batch


class VideoProcessor:
    """Processes videos using existing CLI modules"""
    
    def __init__(self, job_id, user_id):
        self.job_id = job_id
        self.user_id = user_id
        self.cancelled = False
    
    def cancel(self):
        """Cancel processing"""
        self.cancelled = True
    
    def process(self):
        """Process a video job"""
        from models import db, Job, Clip
        from app import create_app, socketio
        from api.websocket import emit_progress, emit_log, emit_error, emit_complete
        
        app = create_app()
        
        with app.app_context():
            try:
                # Get job
                job = Job.query.get(self.job_id)
                if not job:
                    print(f"Job {self.job_id} not found in database")
                    return
                
                print(f"Starting job {self.job_id} processing...")
                
                # Update job status
                job.status = 'downloading'
                job.progress = 10
                job.current_step = 'Getting video information'
                job.started_at = datetime.utcnow()
                db.session.commit()
                print(f"Job {self.job_id} status updated to 'downloading'")
                
                emit_progress(socketio, self.job_id, 10, 'Getting video information')
                emit_log(socketio, self.job_id, 'Fetching video information...')
                
                # Get video info
                video_info = get_video_info(job.video_url)
                if not video_info:
                    raise Exception("Failed to get video information")
                
                job.video_title = video_info['title']
                job.video_duration = video_info.get('duration')
                db.session.commit()
                
                sanitized_title = sanitize_filename(job.video_title)
                
                # Download video
                emit_progress(socketio, self.job_id, 20, 'Downloading video')
                emit_log(socketio, self.job_id, f'Downloading: {job.video_title[:60]}...')
                
                def download_progress_callback(percent):
                    """Update progress during download"""
                    # Map download progress to 20-40% of total progress
                    total_progress = 20 + (percent * 0.2)
                    emit_progress(socketio, self.job_id, int(total_progress), f'Downloading video ({int(percent)}%)')
                    job.progress = int(total_progress)
                    job.current_step = f'Downloading video ({int(percent)}%)'
                    db.session.commit()
                
                video_data = download_video(
                    url=job.video_url,
                    output_dir=str(cli_config.TEMP_PATH),
                    quality=cli_config.VIDEO_QUALITY,
                    filename=sanitized_title,
                    progress_callback=download_progress_callback
                )
                
                if not video_data:
                    raise Exception("Failed to download video")
                
                job.video_path = video_data['path']
                db.session.commit()
                
                # Transcribe
                job.status = 'transcribing'
                job.progress = 40
                job.current_step = 'Transcribing audio'
                db.session.commit()
                
                emit_progress(socketio, self.job_id, 40, 'Transcribing audio')
                emit_log(socketio, self.job_id, 'Transcribing audio with Whisper AI...')
                
                audio_path = download_audio(
                    url=job.video_url,
                    output_path=str(cli_config.TEMP_PATH / f"{sanitized_title}_audio"),
                    audio_format="mp3"
                )
                
                if not audio_path:
                    raise Exception("Failed to download audio")
                
                def transcribe_progress_callback(percent):
                    """Update progress during transcription"""
                    try:
                        # Map transcription progress to 40-60% of total progress
                        total_progress = 40 + (percent * 0.2)
                        step_text = f'Transcribing audio ({int(percent)}%)'
                        
                        print(f"[Job {self.job_id}] Transcription progress: {percent}% -> Total: {int(total_progress)}%")
                        
                        # Re-query job to ensure we have fresh data
                        current_job = Job.query.get(self.job_id)
                        if current_job:
                            current_job.progress = int(total_progress)
                            current_job.current_step = step_text
                            db.session.commit()
                            print(f"[Job {self.job_id}] Updated: progress={current_job.progress}%, step='{current_job.current_step}'")
                        else:
                            print(f"[Job {self.job_id}] Job not found in database!")
                        
                        # Emit WebSocket update
                        emit_progress(socketio, self.job_id, int(total_progress), step_text)
                    except Exception as e:
                        print(f"[Job {self.job_id}] Error updating transcription progress: {e}")
                        import traceback
                        traceback.print_exc()
                
                transcript_cache_path = cli_config.TEMP_PATH / f"{sanitized_title}_transcript.json"
                
                # Test callback before calling transcription
                print(f"[Job {self.job_id}] Testing callback before transcription...")
                transcribe_progress_callback(0)
                print(f"[Job {self.job_id}] Callback test complete")
                
                # Update status to show we're starting transcription
                job.current_step = 'Loading Whisper model...'
                db.session.commit()
                emit_progress(socketio, self.job_id, 40, 'Loading Whisper model...')
                
                try:
                    transcript_segments = transcribe_with_timestamps(
                        audio_path=audio_path,
                        model_name=cli_config.WHISPER_MODEL,
                        device=cli_config.WHISPER_DEVICE,
                        compute_type=cli_config.WHISPER_COMPUTE_TYPE,
                        cache_path=str(transcript_cache_path),
                        show_progress=False,
                        progress_callback=transcribe_progress_callback
                    )
                except Exception as transcribe_error:
                    error_msg = f"Transcription failed: {str(transcribe_error)}"
                    print(f"[Job {self.job_id}] {error_msg}")
                    import traceback
                    traceback.print_exc()
                    raise Exception(error_msg)
                
                print(f"[Job {self.job_id}] Transcription function returned, segments: {len(transcript_segments) if transcript_segments else 0}")
                
                if not transcript_segments:
                    raise Exception("Failed to transcribe audio - no segments returned")
                
                # Ensure final progress is set
                job.progress = 60
                job.current_step = 'Transcribing audio (100%)'
                job.transcript_path = str(transcript_cache_path)
                db.session.commit()
                
                print(f"[Job {self.job_id}] Transcription complete, final progress: {job.progress}%, step: '{job.current_step}'")
                
                # Analyze
                job.status = 'analyzing'
                job.progress = 60
                job.current_step = 'Analyzing for viral segments'
                db.session.commit()
                
                emit_progress(socketio, self.job_id, 60, 'Analyzing for viral segments')
                emit_log(socketio, self.job_id, 'Analyzing transcript with AI...')
                
                viral_segments = analyze_transcript(
                    transcript_segments=transcript_segments,
                    verbose=False
                )
                
                if not viral_segments:
                    job.status = 'completed'
                    job.progress = 100
                    job.current_step = 'Completed (no viral segments found)'
                    job.error_message = "No viral segments found"
                    job.completed_at = datetime.utcnow()
                    db.session.commit()
                    
                    emit_log(socketio, self.job_id, 'No viral segments found', 'warning')
                    emit_complete(socketio, self.job_id, 0)
                    return
                
                # Slice videos
                job.status = 'slicing'
                job.progress = 80
                job.current_step = f'Creating {len(viral_segments)} clips'
                db.session.commit()
                
                emit_progress(socketio, self.job_id, 80, f'Creating {len(viral_segments)} clips')
                emit_log(socketio, self.job_id, f'Creating {len(viral_segments)} video clips...')
                
                output_dir = cli_config.OUTPUT_PATH / sanitized_title
                clip_results = slice_video_batch(
                    input_path=job.video_path,
                    segments=viral_segments,
                    output_dir=str(output_dir),
                    base_filename=sanitized_title,
                    save_metadata=True
                )
                
                # Save clips to database
                clips_created = 0
                for idx, result in enumerate(clip_results):
                    if result['success']:
                        segment = result['segment']
                        
                        clip = Clip(
                            job_id=job.id,
                            filename=Path(result['clip_path']).name,
                            file_path=result['clip_path'],
                            metadata_path=result.get('metadata_path'),
                            title=segment.get('suggested_title'),
                            duration=segment.get('duration_seconds'),
                            start_time=segment.get('start_seconds'),
                            end_time=segment.get('end_seconds'),
                            viral_score=segment.get('viral_score'),
                            criteria_matched=segment.get('criteria_matched'),
                            reasoning=segment.get('reasoning'),
                            file_size=Path(result['clip_path']).stat().st_size
                        )
                        
                        db.session.add(clip)
                        clips_created += 1
                
                job.clips_created = clips_created
                job.status = 'completed'
                job.completed_at = datetime.utcnow()
                job.progress = 100
                db.session.commit()
                
                emit_progress(socketio, self.job_id, 100, 'Completed')
                emit_log(socketio, self.job_id, f'Successfully created {clips_created} clips!')
                emit_complete(socketio, self.job_id, clips_created)
                
                # Cleanup audio file
                try:
                    Path(audio_path).unlink()
                except:
                    pass
            
            except Exception as e:
                print(f"Job {self.job_id} failed with error: {e}")
                import traceback
                traceback.print_exc()
                
                try:
                    job.status = 'failed'
                    job.error_message = str(e)
                    job.completed_at = datetime.utcnow()
                    db.session.commit()
                    
                    emit_error(socketio, self.job_id, str(e))
                    emit_log(socketio, self.job_id, f'Error: {str(e)}', 'error')
                except Exception as inner_e:
                    print(f"Failed to update job error status: {inner_e}")

