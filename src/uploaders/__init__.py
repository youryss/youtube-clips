#!/usr/bin/env python3
"""
Video Upload Module
Base classes for uploading to various social media platforms
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional, List
from pathlib import Path


class UploadResult:
    """Result of an upload operation"""
    
    def __init__(
        self,
        success: bool,
        platform: str,
        video_id: Optional[str] = None,
        url: Optional[str] = None,
        error: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        self.success = success
        self.platform = platform
        self.video_id = video_id
        self.url = url
        self.error = error
        self.metadata = metadata or {}
    
    def __repr__(self):
        if self.success:
            return f"<UploadResult: {self.platform} - Success - {self.url}>"
        else:
            return f"<UploadResult: {self.platform} - Failed - {self.error}>"


class BaseUploader(ABC):
    """
    Abstract base class for social media uploaders
    """
    
    def __init__(self, platform_name: str):
        self.platform_name = platform_name
    
    @abstractmethod
    def authenticate(self) -> bool:
        """
        Authenticate with the platform
        
        Returns:
            True if authentication successful, False otherwise
        """
        pass
    
    @abstractmethod
    def upload_video(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: Optional[List[str]] = None,
        **kwargs
    ) -> UploadResult:
        """
        Upload a video to the platform
        
        Args:
            video_path: Path to the video file
            title: Video title
            description: Video description
            tags: List of tags/hashtags
            **kwargs: Platform-specific parameters
        
        Returns:
            UploadResult object
        """
        pass
    
    @abstractmethod
    def is_authenticated(self) -> bool:
        """
        Check if currently authenticated
        
        Returns:
            True if authenticated, False otherwise
        """
        pass
    
    def validate_video(self, video_path: str) -> tuple[bool, Optional[str]]:
        """
        Validate video file before upload
        
        Args:
            video_path: Path to video file
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        video_path = Path(video_path)
        
        if not video_path.exists():
            return False, f"Video file not found: {video_path}"
        
        if not video_path.is_file():
            return False, f"Path is not a file: {video_path}"
        
        if video_path.stat().st_size == 0:
            return False, f"Video file is empty: {video_path}"
        
        # Check file extension
        valid_extensions = {'.mp4', '.mov', '.avi', '.webm', '.mkv'}
        if video_path.suffix.lower() not in valid_extensions:
            return False, f"Invalid video format: {video_path.suffix}. Must be one of {valid_extensions}"
        
        return True, None
    
    def format_tags(self, tags: List[str]) -> List[str]:
        """
        Format tags for the platform
        
        Args:
            tags: List of tags
        
        Returns:
            Formatted list of tags
        """
        formatted = []
        for tag in tags:
            tag = tag.strip()
            # Remove # if present
            if tag.startswith('#'):
                tag = tag[1:]
            # Remove spaces
            tag = tag.replace(' ', '')
            if tag:
                formatted.append(tag)
        return formatted

