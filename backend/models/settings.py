#!/usr/bin/env python3
"""
User Settings model
"""

from datetime import datetime
from . import db


class UserSettings(db.Model):
    """User-specific settings for video processing"""
    
    __tablename__ = 'user_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Whisper settings
    whisper_model = db.Column(db.String(50), default='small')
    whisper_device = db.Column(db.String(50), default='auto')
    whisper_compute_type = db.Column(db.String(50), default='int8')
    
    # OpenAI settings
    openai_model = db.Column(db.String(100), default='gpt-4-turbo-preview')
    
    # Video settings
    video_quality = db.Column(db.String(50), default='1080p')
    
    # Clip settings
    min_clip_duration = db.Column(db.Integer, default=15)
    max_clip_duration = db.Column(db.Integer, default=60)
    clip_padding_before = db.Column(db.Float, default=0.5)
    clip_padding_after = db.Column(db.Float, default=0.5)
    
    # Viral analysis settings
    max_clips_per_video = db.Column(db.Integer, default=5)
    min_viral_score = db.Column(db.Float, default=7.0)
    active_criteria = db.Column(db.JSON, default=list)  # List of active criteria
    
    # Thumbnail settings
    thumbnail_mode = db.Column(db.String(50), default='basic')  # none, basic, advanced
    thumbnail_frames = db.Column(db.Integer, default=8)
    
    # Upload settings
    default_youtube_privacy = db.Column(db.String(50), default='private')  # private, unlisted, public
    default_youtube_category = db.Column(db.String(50), default='22')  # People & Blogs
    make_shorts = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'whisper_model': self.whisper_model,
            'whisper_device': self.whisper_device,
            'whisper_compute_type': self.whisper_compute_type,
            'openai_model': self.openai_model,
            'video_quality': self.video_quality,
            'min_clip_duration': self.min_clip_duration,
            'max_clip_duration': self.max_clip_duration,
            'clip_padding_before': self.clip_padding_before,
            'clip_padding_after': self.clip_padding_after,
            'max_clips_per_video': self.max_clips_per_video,
            'min_viral_score': self.min_viral_score,
            'active_criteria': self.active_criteria or ['viral_hooks', 'emotional_peaks', 'value_bombs', 'humor_moments'],
            'thumbnail_mode': self.thumbnail_mode,
            'thumbnail_frames': self.thumbnail_frames,
            'default_youtube_privacy': self.default_youtube_privacy,
            'default_youtube_category': self.default_youtube_category,
            'make_shorts': self.make_shorts
        }
    
    @staticmethod
    def create_default(user_id):
        """Create default settings for a user"""
        settings = UserSettings(
            user_id=user_id,
            active_criteria=['viral_hooks', 'emotional_peaks', 'value_bombs', 'humor_moments']
        )
        return settings
    
    def __repr__(self):
        return f'<UserSettings for user {self.user_id}>'








