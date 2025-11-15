#!/usr/bin/env python3
"""
Job model
"""

from datetime import datetime
from . import db


class Job(db.Model):
    """Video processing job"""
    
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Video info
    video_url = db.Column(db.Text, nullable=False)
    video_title = db.Column(db.String(500))
    video_duration = db.Column(db.Float)  # Duration in seconds
    
    # Status: pending, downloading, transcribing, analyzing, slicing, completed, failed, cancelled
    status = db.Column(db.String(50), default='pending', nullable=False, index=True)
    progress = db.Column(db.Float, default=0.0)  # 0-100
    current_step = db.Column(db.String(100))  # Current processing step
    
    # Results
    clips_created = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text)
    
    # File paths
    video_path = db.Column(db.Text)
    transcript_path = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    clips = db.relationship('Clip', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_clips=False):
        """Convert to dictionary"""
        import re
        from .clip import Clip
        
        data = {
            'id': self.id,
            'video_url': self.video_url,
            'video_title': self.video_title,
            'video_duration': self.video_duration,
            'status': self.status,
            'progress': self.progress,
            'current_step': self.current_step,
            'clips_created': self.clips_created,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
        
        # Add thumbnail URL if YouTube video
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.video_url)
            if match:
                youtube_id = match.group(1)
                data['thumbnail_url'] = f"https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg"
                data['has_thumbnail'] = True
                break
        else:
            # Check if first clip has thumbnail
            first_clip = self.clips.filter(Clip.thumbnail_path.isnot(None)).first()
            if first_clip and first_clip.thumbnail_path:
                data['has_thumbnail'] = True
                data['thumbnail_clip_id'] = first_clip.id
            else:
                data['has_thumbnail'] = False
        
        if include_clips:
            data['clips'] = [clip.to_dict() for clip in self.clips.all()]
        
        return data
    
    def __repr__(self):
        return f'<Job {self.id}: {self.video_title or self.video_url[:50]}>'

