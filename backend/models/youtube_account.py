#!/usr/bin/env python3
"""
YouTube Account model
"""

from datetime import datetime
from . import db


class YouTubeAccount(db.Model):
    """YouTube account with OAuth credentials"""
    
    __tablename__ = 'youtube_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # YouTube account info
    channel_id = db.Column(db.String(255), unique=True, nullable=False)
    channel_title = db.Column(db.String(255))
    channel_thumbnail = db.Column(db.Text)
    
    # OAuth credentials (encrypted JSON)
    credentials_json = db.Column(db.Text, nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)  # Can upload custom thumbnails
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'channel_id': self.channel_id,
            'channel_title': self.channel_title,
            'channel_thumbnail': self.channel_thumbnail,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None
        }
    
    def __repr__(self):
        return f'<YouTubeAccount {self.channel_title}>'








