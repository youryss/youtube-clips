#!/usr/bin/env python3
"""
Jobs API endpoints
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Job, Clip
from services.job_manager import get_job_manager
from pathlib import Path
from typing import Optional
import subprocess
import json
import os
import re

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('', methods=['GET'])
@jwt_required()
def list_jobs():
    """List all jobs for current user"""
    user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = Job.query.filter_by(user_id=user_id).order_by(Job.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'jobs': [job.to_dict() for job in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@jobs_bp.route('', methods=['POST'])
@jwt_required()
def create_job():
    """Create a new job"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('video_url'):
        return jsonify({'error': 'video_url is required'}), 400
    
    video_url = data['video_url'].strip()
    
    job = Job(user_id=user_id, video_url=video_url, status='pending')
    db.session.add(job)
    db.session.commit()
    
    print(f"[API] Job {job.id} created, queuing for processing...", flush=True)
    
    try:
        job_manager = get_job_manager()
        print(f"[API] Job manager instance: {job_manager}", flush=True)
        if job_manager:
            job_manager.add_job(job.id, user_id)
            print(f"[API] Job {job.id} queued successfully", flush=True)
        else:
            print(f"[API] ERROR: Job manager is None!", flush=True)
    except Exception as e:
        print(f"[API] ERROR queueing job {job.id}: {e}", flush=True)
        import traceback
        traceback.print_exc()
    
    return jsonify({
        'message': 'Job created successfully',
        'job': job.to_dict()
    }), 201


@jobs_bp.route('/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job(job_id):
    """Get job details"""
    user_id = int(get_jwt_identity())
    
    job = Job.query.filter_by(id=job_id, user_id=user_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify({'job': job.to_dict()}), 200


@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    """Delete a job"""
    user_id = int(get_jwt_identity())
    
    job = Job.query.filter_by(id=job_id, user_id=user_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    db.session.delete(job)
    db.session.commit()
    
    return jsonify({'message': 'Job deleted successfully'}), 200


@jobs_bp.route('/<int:job_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_job(job_id):
    """Cancel a running job"""
    user_id = int(get_jwt_identity())
    
    job = Job.query.filter_by(id=job_id, user_id=user_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    if job.status not in ['pending', 'downloading', 'transcribing', 'analyzing', 'slicing']:
        return jsonify({'error': 'Job cannot be cancelled'}), 400
    
    job.status = 'cancelled'
    job.error_message = 'Job cancelled by user'
    db.session.commit()
    
    return jsonify({'message': 'Job cancelled successfully'}), 200


@jobs_bp.route('/<int:job_id>/logs', methods=['GET'])
@jwt_required()
def get_job_logs(job_id):
    """Get logs for a specific job"""
    user_id = int(get_jwt_identity())
    
    job = Job.query.filter_by(id=job_id, user_id=user_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Return job details which include error messages and status
    return jsonify({
        'job_id': job.id,
        'status': job.status,
        'error_message': job.error_message,
        'current_step': job.current_step,
        'progress': job.progress,
        'created_at': job.created_at.isoformat() if job.created_at else None,
        'started_at': job.started_at.isoformat() if job.started_at else None,
        'completed_at': job.completed_at.isoformat() if job.completed_at else None,
        'message': 'Check Docker logs with: docker-compose logs backend | grep "Job ' + str(job_id) + '"'
    }), 200


def load_transcript_text(transcript_path: str) -> Optional[str]:
    """
    Load the full transcript text from transcript path
    
    Args:
        transcript_path: Path to transcript JSON file
    
    Returns:
        Full transcript text or None if not found
    """
    try:
        if not transcript_path or not os.path.exists(transcript_path):
            return None
        
        # Load transcript segments
        with open(transcript_path, 'r', encoding='utf-8') as f:
            transcript_segments = json.load(f)
        
        if not transcript_segments or not isinstance(transcript_segments, list):
            return None
        
        # Combine all transcript text
        transcript_text = " ".join(
            segment.get('text', '') for segment in transcript_segments
            if isinstance(segment, dict) and 'text' in segment
        )
        
        return transcript_text.strip() if transcript_text else None
    
    except Exception as e:
        # Silently fail - transcript is optional
        print(f"Warning: Could not load transcript: {e}")
        return None


@jobs_bp.route('/<int:job_id>/transcript', methods=['GET'])
@jwt_required()
def get_job_transcript(job_id):
    """Get transcript for a specific job"""
    user_id = int(get_jwt_identity())
    
    job = Job.query.filter_by(id=job_id, user_id=user_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    if not job.transcript_path:
        return jsonify({'error': 'Transcript not available'}), 404
    
    transcript_text = load_transcript_text(job.transcript_path)
    
    if not transcript_text:
        return jsonify({'error': 'Transcript file not found or invalid'}), 404
    
    return jsonify({
        'transcript': transcript_text,
        'job_id': job.id
    }), 200


def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


@jobs_bp.route('/<int:job_id>/thumbnail', methods=['GET'])
@jwt_required()
def get_job_thumbnail(job_id):
    """Get job thumbnail - tries YouTube thumbnail first, then first clip thumbnail"""
    user_id = int(get_jwt_identity())
    
    job = Job.query.filter_by(id=job_id, user_id=user_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Try YouTube thumbnail first
    youtube_id = extract_youtube_video_id(job.video_url)
    if youtube_id:
        # Return YouTube thumbnail URL (maxresdefault is highest quality)
        thumbnail_url = f"https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg"
        return jsonify({
            'thumbnail_url': thumbnail_url,
            'type': 'youtube'
        }), 200
    
    # Try first clip's thumbnail
    first_clip = job.clips.filter(Clip.thumbnail_path.isnot(None)).first()
    if first_clip and first_clip.thumbnail_path and os.path.exists(first_clip.thumbnail_path):
        return send_file(first_clip.thumbnail_path, mimetype='image/jpeg')
    
    return jsonify({'error': 'Thumbnail not available'}), 404
