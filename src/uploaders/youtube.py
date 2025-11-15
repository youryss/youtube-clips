#!/usr/bin/env python3
"""
YouTube Upload Module
Handles authentication and video uploads to YouTube (including Shorts)
"""

import os
import json
from pathlib import Path
from typing import List, Optional, Dict
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from uploaders import BaseUploader, UploadResult


# YouTube API scopes
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']


class YouTubeUploader(BaseUploader):
    """
    YouTube video uploader with OAuth 2.0 authentication
    """
    
    def __init__(
        self,
        client_secrets_file: str,
        token_file: str = 'youtube_token.json',
        default_category: str = '22',  # People & Blogs
        default_privacy: str = 'private'  # private, unlisted, or public
    ):
        """
        Initialize YouTube uploader
        
        Args:
            client_secrets_file: Path to OAuth client secrets JSON file
            token_file: Path to store/load the OAuth token
            default_category: YouTube category ID (22=People & Blogs, 28=Science & Tech)
            default_privacy: Default privacy status (private, unlisted, public)
        """
        super().__init__('YouTube')
        
        self.client_secrets_file = Path(client_secrets_file)
        self.token_file = Path(token_file)
        self.default_category = default_category
        self.default_privacy = default_privacy
        self.youtube = None
        self.credentials = None
    
    def authenticate(self) -> bool:
        """
        Authenticate with YouTube API using OAuth 2.0
        
        Returns:
            True if authentication successful
        """
        try:
            # Check if we have valid credentials
            if self.token_file.exists():
                self.credentials = Credentials.from_authorized_user_file(
                    str(self.token_file),
                    SCOPES
                )
            
            # If credentials are not valid or don't exist, get new ones
            if not self.credentials or not self.credentials.valid:
                if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                    print("Refreshing access token...")
                    self.credentials.refresh(Request())
                else:
                    if not self.client_secrets_file.exists():
                        print(f"Error: Client secrets file not found: {self.client_secrets_file}")
                        print("Please download the OAuth credentials from Google Cloud Console.")
                        return False
                    
                    print("Opening browser for YouTube authorization...")
                    print("Please sign in and authorize the app to upload videos.")
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        str(self.client_secrets_file),
                        SCOPES
                    )
                    # Force account selection every time
                    flow.authorization_url(prompt='select_account')
                    self.credentials = flow.run_local_server(
                        port=8080,
                        prompt='select_account'  # Forces Google to show account chooser
                    )
                
                # Save credentials for next time
                with open(self.token_file, 'w') as token:
                    token.write(self.credentials.to_json())
                print(f"✓ Credentials saved to {self.token_file}")
            
            # Build YouTube API client
            self.youtube = build('youtube', 'v3', credentials=self.credentials)
            print("✓ Successfully authenticated with YouTube")
            return True
        
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
    
    def is_authenticated(self) -> bool:
        """
        Check if currently authenticated
        
        Returns:
            True if authenticated
        """
        return self.youtube is not None and self.credentials is not None
    
    def set_thumbnail(
        self,
        video_id: str,
        thumbnail_path: str
    ) -> bool:
        """
        Set a custom thumbnail for an uploaded video
        
        Args:
            video_id: YouTube video ID
            thumbnail_path: Path to thumbnail image file
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_authenticated():
            print("Error: Not authenticated with YouTube")
            return False
        
        try:
            thumbnail_path_obj = Path(thumbnail_path)
            
            # Validate thumbnail file
            if not thumbnail_path_obj.exists():
                print(f"Error: Thumbnail file not found: {thumbnail_path}")
                return False
            
            # Check file size (max 2MB for YouTube)
            file_size_mb = thumbnail_path_obj.stat().st_size / (1024 * 1024)
            if file_size_mb > 2:
                print(f"Error: Thumbnail too large: {file_size_mb:.1f}MB (max 2MB)")
                return False
            
            # Create media upload
            media = MediaFileUpload(
                thumbnail_path,
                mimetype='image/jpeg',
                resumable=False
            )
            
            # Upload thumbnail
            request = self.youtube.thumbnails().set(
                videoId=video_id,
                media_body=media
            )
            
            response = request.execute()
            
            if response:
                print(f"  ✓ Thumbnail uploaded successfully")
                return True
            else:
                print(f"  ✗ Thumbnail upload failed")
                return False
        
        except HttpError as e:
            print(f"  ✗ Thumbnail upload HTTP error: {e}")
            return False
        
        except Exception as e:
            print(f"  ✗ Thumbnail upload error: {e}")
            return False
    
    def upload_video(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: Optional[List[str]] = None,
        category: Optional[str] = None,
        privacy: Optional[str] = None,
        make_shorts: bool = True,
        thumbnail_path: Optional[str] = None,
        **kwargs
    ) -> UploadResult:
        """
        Upload video to YouTube
        
        Args:
            video_path: Path to video file
            title: Video title (max 100 characters)
            description: Video description
            tags: List of tags (max 500 characters total)
            category: YouTube category ID (defaults to self.default_category)
            privacy: Privacy status (private, unlisted, public)
            make_shorts: Add #Shorts tag and optimize for YouTube Shorts
            thumbnail_path: Optional path to custom thumbnail image
            **kwargs: Additional YouTube API parameters
        
        Returns:
            UploadResult object
        """
        # Validate video
        is_valid, error = self.validate_video(video_path)
        if not is_valid:
            return UploadResult(
                success=False,
                platform=self.platform_name,
                error=error
            )
        
        # Check authentication
        if not self.is_authenticated():
            if not self.authenticate():
                return UploadResult(
                    success=False,
                    platform=self.platform_name,
                    error="Failed to authenticate with YouTube"
                )
        
        try:
            # Prepare tags
            if tags is None:
                tags = []
            
            # Add #Shorts tag if requested
            if make_shorts and 'Shorts' not in tags and 'shorts' not in tags:
                tags.insert(0, 'Shorts')
            
            # Format tags
            formatted_tags = self.format_tags(tags)
            
            # Truncate title if too long
            if len(title) > 100:
                title = title[:97] + '...'
            
            # Prepare video metadata
            body = {
                'snippet': {
                    'title': title,
                    'description': description,
                    'tags': formatted_tags,
                    'categoryId': category or self.default_category
                },
                'status': {
                    'privacyStatus': privacy or self.default_privacy,
                    'selfDeclaredMadeForKids': False
                }
            }
            
            # For Shorts, set to 9:16 ratio metadata (YouTube auto-detects)
            if make_shorts:
                body['status']['madeForKids'] = False
            
            # Create media upload object
            media = MediaFileUpload(
                video_path,
                chunksize=1024*1024,  # 1MB chunks
                resumable=True
            )
            
            print(f"Uploading to YouTube: {title}")
            print(f"  Privacy: {privacy or self.default_privacy}")
            print(f"  Tags: {', '.join(formatted_tags[:5])}")
            
            # Execute upload request
            request = self.youtube.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media
            )
            
            # Upload with progress
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    print(f"  Upload progress: {progress}%", end='\r')
            
            print(f"\n✓ Upload complete!")
            
            video_id = response['id']
            video_url = f"https://youtube.com/watch?v={video_id}"
            shorts_url = f"https://youtube.com/shorts/{video_id}" if make_shorts else None
            
            print(f"  Video ID: {video_id}")
            print(f"  URL: {shorts_url if make_shorts else video_url}")
            
            # Upload thumbnail if provided
            thumbnail_uploaded = False
            if thumbnail_path:
                print(f"  Uploading custom thumbnail...")
                thumbnail_uploaded = self.set_thumbnail(video_id, thumbnail_path)
            
            return UploadResult(
                success=True,
                platform=self.platform_name,
                video_id=video_id,
                url=shorts_url if make_shorts else video_url,
                metadata={
                    'title': title,
                    'privacy': privacy or self.default_privacy,
                    'category': category or self.default_category,
                    'tags': formatted_tags,
                    'is_short': make_shorts,
                    'thumbnail_uploaded': thumbnail_uploaded
                }
            )
        
        except HttpError as e:
            error_msg = f"HTTP error {e.resp.status}: {e.error_details}"
            print(f"✗ Upload failed: {error_msg}")
            return UploadResult(
                success=False,
                platform=self.platform_name,
                error=error_msg
            )
        
        except Exception as e:
            error_msg = str(e)
            print(f"✗ Upload failed: {error_msg}")
            return UploadResult(
                success=False,
                platform=self.platform_name,
                error=error_msg
            )
    
    def get_video_info(self, video_id: str) -> Optional[Dict]:
        """
        Get information about an uploaded video
        
        Args:
            video_id: YouTube video ID
        
        Returns:
            Video information dictionary or None
        """
        if not self.is_authenticated():
            return None
        
        try:
            request = self.youtube.videos().list(
                part='snippet,status,statistics',
                id=video_id
            )
            response = request.execute()
            
            if response['items']:
                return response['items'][0]
            return None
        
        except Exception as e:
            print(f"Error getting video info: {e}")
            return None
    
    def validate_video(self, video_path: str) -> tuple[bool, Optional[str]]:
        """
        Validate video for YouTube upload
        
        Args:
            video_path: Path to video file
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Run base validation
        is_valid, error = super().validate_video(video_path)
        if not is_valid:
            return is_valid, error
        
        video_path = Path(video_path)
        
        # Check file size (256GB max for YouTube, but let's be reasonable)
        file_size_mb = video_path.stat().st_size / (1024 * 1024)
        if file_size_mb > 256 * 1024:  # 256 GB
            return False, f"File too large: {file_size_mb:.1f}MB (max 256GB)"
        
        # YouTube prefers MP4
        if video_path.suffix.lower() not in ['.mp4', '.mov']:
            print(f"  Warning: {video_path.suffix} format. YouTube prefers .mp4")
        
        return True, None

