#!/usr/bin/env python3
"""
Clip model
"""

from datetime import datetime
from . import db


class Clip(db.Model):
    """Generated video clip"""
    
    __tablename__ = 'clips'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    
    # Clip info
    filename = db.Column(db.String(500), nullable=False)
    file_path = db.Column(db.Text, nullable=False)
    thumbnail_path = db.Column(db.Text)
    metadata_path = db.Column(db.Text)
    
    # Metadata
    title = db.Column(db.String(500))
    duration = db.Column(db.Float)  # Duration in seconds
    start_time = db.Column(db.Float)  # Start time in source video
    end_time = db.Column(db.Float)  # End time in source video
    viral_score = db.Column(db.Float)
    criteria_matched = db.Column(db.JSON)  # List of matched criteria
    reasoning = db.Column(db.Text)
    
    # File info
    file_size = db.Column(db.BigInteger)  # Size in bytes
    
    # Upload status
    is_uploaded = db.Column(db.Boolean, default=False)
    youtube_video_id = db.Column(db.String(100))
    youtube_url = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime)
    upload_error = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'job_id': self.job_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'thumbnail_path': self.thumbnail_path,
            'title': self.title,
            'duration': self.duration,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'viral_score': self.viral_score,
            'criteria_matched': self.criteria_matched,
            'reasoning': self.reasoning,
            'file_size': self.file_size,
            'is_uploaded': self.is_uploaded,
            'youtube_video_id': self.youtube_video_id,
            'youtube_url': self.youtube_url,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'upload_error': self.upload_error,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Clip {self.id}: {self.filename}>'

