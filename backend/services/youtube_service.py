#!/usr/bin/env python3
"""
YouTube Service
Handles OAuth and video uploads using stored credentials
"""

import os
import json
from pathlib import Path
from typing import Optional, Dict
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from flask import current_app, url_for

# YouTube API scopes
SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly']


class YouTubeService:
    """Service for YouTube OAuth and uploads"""
    
    @staticmethod
    def get_client_secrets_path() -> Optional[Path]:
        """Get path to client secrets file"""
        secrets_path = current_app.config.get('YOUTUBE_CLIENT_SECRETS_FILE')
        if secrets_path:
            path = Path(secrets_path)
            if path.exists():
                return path
        # Try default location (project root)
        import sys
        from pathlib import Path as PathLib
        # Go up from backend/ to project root
        backend_dir = PathLib(__file__).parent.parent.parent
        default_path = backend_dir / 'client_secrets.json'
        if default_path.exists():
            return default_path
        return None
    
    @staticmethod
    def get_flow(redirect_uri: str) -> Optional[Flow]:
        """Create OAuth flow"""
        secrets_path = YouTubeService.get_client_secrets_path()
        if not secrets_path:
            return None
        
        flow = Flow.from_client_secrets_file(
            str(secrets_path),
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        return flow
    
    @staticmethod
    def get_authorization_url(redirect_uri: str) -> Optional[Dict[str, str]]:
        """Get OAuth authorization URL"""
        flow = YouTubeService.get_flow(redirect_uri)
        if not flow:
            return None
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return {
            'authorization_url': authorization_url,
            'state': state
        }
    
    @staticmethod
    def handle_callback(
        authorization_code: str,
        state: str,
        redirect_uri: str
    ) -> Optional[Dict]:
        """Handle OAuth callback and return credentials"""
        flow = YouTubeService.get_flow(redirect_uri)
        if not flow:
            return None
        
        try:
            flow.fetch_token(code=authorization_code)
            credentials = flow.credentials
            
            # Get channel info
            youtube = build('youtube', 'v3', credentials=credentials)
            channels_response = youtube.channels().list(
                part='snippet',
                mine=True
            ).execute()
            
            if not channels_response.get('items'):
                return None
            
            channel = channels_response['items'][0]
            channel_id = channel['id']
            channel_title = channel['snippet']['title']
            channel_thumbnail = channel['snippet']['thumbnails']['default']['url']
            
            return {
                'credentials': credentials.to_json(),
                'channel_id': channel_id,
                'channel_title': channel_title,
                'channel_thumbnail': channel_thumbnail
            }
        except Exception as e:
            print(f"Error handling OAuth callback: {e}")
            return None
    
    @staticmethod
    def get_credentials_from_json(credentials_json: str) -> Optional[Credentials]:
        """Load credentials from JSON string"""
        try:
            creds_dict = json.loads(credentials_json)
            credentials = Credentials.from_authorized_user_info(creds_dict, SCOPES)
            
            # Refresh if expired
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
            
            return credentials
        except Exception as e:
            print(f"Error loading credentials: {e}")
            return None
    
    @staticmethod
    def upload_video(
        credentials_json: str,
        video_path: str,
        title: str,
        description: str,
        tags: Optional[list] = None,
        category: str = '22',
        privacy: str = 'private',
        make_shorts: bool = True,
        thumbnail_path: Optional[str] = None
    ) -> Dict:
        """Upload video to YouTube"""
        credentials = YouTubeService.get_credentials_from_json(credentials_json)
        if not credentials:
            return {
                'success': False,
                'error': 'Failed to load credentials'
            }
        
        try:
            youtube = build('youtube', 'v3', credentials=credentials)
            
            # Prepare tags
            if tags is None:
                tags = []
            if make_shorts and 'Shorts' not in tags:
                tags.insert(0, 'Shorts')
            
            # Truncate title
            if len(title) > 100:
                title = title[:97] + '...'
            
            # Prepare metadata
            body = {
                'snippet': {
                    'title': title,
                    'description': description,
                    'tags': tags,
                    'categoryId': category
                },
                'status': {
                    'privacyStatus': privacy,
                    'selfDeclaredMadeForKids': False
                }
            }
            
            # Upload video
            media = MediaFileUpload(
                video_path,
                chunksize=-1,
                resumable=True,
                mimetype='video/*'
            )
            
            insert_request = youtube.videos().insert(
                part=','.join(body.keys()),
                body=body,
                media_body=media
            )
            
            # Execute upload
            response = None
            while response is None:
                status, response = insert_request.next_chunk()
                if status:
                    print(f"Upload progress: {int(status.progress() * 100)}%")
            
            if 'id' in response:
                video_id = response['id']
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                shorts_url = f"https://www.youtube.com/shorts/{video_id}"
                
                # Upload thumbnail if provided
                thumbnail_uploaded = False
                if thumbnail_path and os.path.exists(thumbnail_path):
                    try:
                        file_size = os.path.getsize(thumbnail_path)
                        if file_size <= 2 * 1024 * 1024:  # 2MB max
                            media_thumbnail = MediaFileUpload(
                                thumbnail_path,
                                mimetype='image/jpeg',
                                resumable=False
                            )
                            youtube.thumbnails().set(
                                videoId=video_id,
                                media_body=media_thumbnail
                            ).execute()
                            thumbnail_uploaded = True
                    except Exception as e:
                        print(f"Thumbnail upload error: {e}")
                
                return {
                    'success': True,
                    'video_id': video_id,
                    'video_url': video_url,
                    'shorts_url': shorts_url,
                    'thumbnail_uploaded': thumbnail_uploaded
                }
            else:
                return {
                    'success': False,
                    'error': 'Upload completed but no video ID returned'
                }
        
        except HttpError as e:
            error_content = e.content.decode('utf-8') if e.content else str(e)
            return {
                'success': False,
                'error': f'YouTube API error: {error_content}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Upload error: {str(e)}'
            }

