#!/usr/bin/env python3
"""
YouTube OAuth API endpoints
"""

from flask import Blueprint, request, jsonify, url_for, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, YouTubeAccount, Clip, Job
from services.youtube_service import YouTubeService
from datetime import datetime
import json
import os

youtube_bp = Blueprint('youtube', __name__)


@youtube_bp.route('/accounts', methods=['GET'])
@jwt_required()
def list_accounts():
    """
    List user's YouTube accounts
    ---
    tags:
      - YouTube
    summary: List connected YouTube accounts
    description: Returns all YouTube accounts connected by the authenticated user
    security:
      - Bearer: []
    responses:
      200:
        description: Accounts retrieved successfully
        schema:
          type: object
          properties:
            accounts:
              type: array
              items:
                type: object
    """
    user_id = int(get_jwt_identity())
    
    accounts = YouTubeAccount.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'accounts': [acc.to_dict() for acc in accounts]
    }), 200


@youtube_bp.route('/auth/url', methods=['GET'])
@jwt_required()
def get_auth_url():
    """
    Get YouTube OAuth authorization URL
    ---
    tags:
      - YouTube
    summary: Get YouTube OAuth authorization URL
    description: Returns the OAuth authorization URL for connecting a YouTube account
    security:
      - Bearer: []
    parameters:
      - in: query
        name: redirect_uri
        type: string
        required: false
        description: Redirect URI for OAuth callback
    responses:
      200:
        description: Authorization URL generated successfully
        schema:
          type: object
          properties:
            authorization_url:
              type: string
            state:
              type: string
      500:
        description: Failed to create authorization URL
    """
    try:
        # Get redirect URI from request or use default
        redirect_uri = request.args.get('redirect_uri')
        if not redirect_uri:
            # Use frontend URL for redirect
            frontend_url = current_app.config.get('CORS_ORIGINS', ['http://localhost:3001'])[0]
            redirect_uri = f"{frontend_url}/youtube/callback"
        
        result = YouTubeService.get_authorization_url(redirect_uri)
        
        if not result:
            return jsonify({
                'error': 'Failed to create authorization URL',
                'message': 'Please ensure client_secrets.json is configured'
            }), 500
        
        return jsonify({
            'authorization_url': result['authorization_url'],
            'state': result['state']
        }), 200
    
    except Exception as e:
        print(f"Error getting auth URL: {e}")
        return jsonify({
            'error': 'Failed to get authorization URL',
            'message': str(e)
        }), 500


@youtube_bp.route('/auth/callback', methods=['POST'])
@jwt_required()
def auth_callback():
    """
    Handle YouTube OAuth callback
    ---
    tags:
      - YouTube
    summary: Handle YouTube OAuth callback
    description: Processes the OAuth callback from YouTube and connects the account
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - code
          properties:
            code:
              type: string
              description: Authorization code from YouTube
            state:
              type: string
              description: State parameter for OAuth
            redirect_uri:
              type: string
              description: Redirect URI used in authorization
    responses:
      200:
        description: Account connected successfully
        schema:
          type: object
          properties:
            message:
              type: string
            account:
              type: object
      400:
        description: Invalid request or failed to process callback
      500:
        description: Server error processing callback
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('code'):
        return jsonify({'error': 'Authorization code is required'}), 400
    
    code = data['code']
    state = data.get('state', '')
    redirect_uri = data.get('redirect_uri')
    
    if not redirect_uri:
        frontend_url = current_app.config.get('CORS_ORIGINS', ['http://localhost:3001'])[0]
        redirect_uri = f"{frontend_url}/youtube/callback"
    
    try:
        result = YouTubeService.handle_callback(code, state, redirect_uri)
        
        if not result:
            return jsonify({
                'error': 'Failed to process OAuth callback'
            }), 400
        
        # Check if account already exists
        existing_account = YouTubeAccount.query.filter_by(
            channel_id=result['channel_id'],
            user_id=user_id
        ).first()
        
        if existing_account:
            # Update existing account
            existing_account.credentials_json = result['credentials']
            existing_account.channel_title = result['channel_title']
            existing_account.channel_thumbnail = result['channel_thumbnail']
            existing_account.is_active = True
            existing_account.updated_at = datetime.utcnow()
            account = existing_account
        else:
            # Create new account
            account = YouTubeAccount(
                user_id=user_id,
                channel_id=result['channel_id'],
                channel_title=result['channel_title'],
                channel_thumbnail=result['channel_thumbnail'],
                credentials_json=result['credentials'],
                is_active=True
            )
            db.session.add(account)
        
        db.session.commit()
        
        return jsonify({
            'message': 'YouTube account connected successfully',
            'account': account.to_dict()
        }), 200
    
    except Exception as e:
        print(f"Error handling callback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to process OAuth callback',
            'message': str(e)
        }), 500


@youtube_bp.route('/accounts/<int:account_id>', methods=['DELETE'])
@jwt_required()
def delete_account(account_id):
    """
    Delete YouTube account
    ---
    tags:
      - YouTube
    summary: Delete a connected YouTube account
    description: Removes a YouTube account connection for the authenticated user
    security:
      - Bearer: []
    parameters:
      - in: path
        name: account_id
        type: integer
        required: true
        description: ID of the account to delete
    responses:
      200:
        description: Account deleted successfully
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: Account not found
    """
    user_id = int(get_jwt_identity())
    
    account = YouTubeAccount.query.filter_by(id=account_id, user_id=user_id).first()
    
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    db.session.delete(account)
    db.session.commit()
    
    return jsonify({'message': 'Account deleted successfully'}), 200


@youtube_bp.route('/clips/<int:clip_id>/upload', methods=['POST'])
@jwt_required()
def upload_clip(clip_id):
    """
    Upload a clip to YouTube
    ---
    tags:
      - YouTube
    summary: Upload a clip to YouTube
    description: Uploads a generated clip to YouTube with optional metadata
    security:
      - Bearer: []
    parameters:
      - in: path
        name: clip_id
        type: integer
        required: true
        description: ID of the clip to upload
      - in: body
        name: body
        required: false
        schema:
          type: object
          properties:
            account_id:
              type: integer
              description: YouTube account ID to use (optional, uses default if not provided)
            title:
              type: string
              description: Video title
            description:
              type: string
              description: Video description
            tags:
              type: array
              items:
                type: string
              description: Video tags
            category:
              type: string
              default: "22"
              description: YouTube category ID
            privacy:
              type: string
              enum: [private, unlisted, public]
              default: private
              description: Video privacy setting
            make_shorts:
              type: boolean
              default: true
              description: Whether to upload as YouTube Shorts
    responses:
      200:
        description: Clip uploaded successfully
        schema:
          type: object
          properties:
            message:
              type: string
            video_id:
              type: string
            video_url:
              type: string
            shorts_url:
              type: string
            thumbnail_uploaded:
              type: boolean
      400:
        description: No active YouTube account found or invalid request
      404:
        description: Clip not found or clip file not found
      500:
        description: Upload failed
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    # Get clip and verify ownership
    clip = Clip.query.join(Job).filter(
        Clip.id == clip_id,
        Job.user_id == user_id
    ).first()
    
    if not clip:
        return jsonify({'error': 'Clip not found'}), 404
    
    if not os.path.exists(clip.file_path):
        return jsonify({'error': 'Clip file not found'}), 404
    
    # Get YouTube account
    account_id = data.get('account_id')
    if account_id:
        account = YouTubeAccount.query.filter_by(
            id=account_id,
            user_id=user_id,
            is_active=True
        ).first()
    else:
        account = YouTubeAccount.query.filter_by(user_id=user_id, is_active=True).first()
    
    if not account:
        return jsonify({
            'error': 'No active YouTube account found',
            'message': 'Please connect a YouTube account first'
        }), 400
    
    # Prepare upload parameters
    title = data.get('title') or clip.title or clip.filename
    description = data.get('description') or f"Generated viral clip from {clip.title or 'video'}"
    tags = data.get('tags', [])
    category = data.get('category', '22')
    privacy = data.get('privacy', 'private')
    make_shorts = data.get('make_shorts', True)
    thumbnail_path = clip.thumbnail_path if os.path.exists(clip.thumbnail_path or '') else None
    
    try:
        # Upload video
        result = YouTubeService.upload_video(
            credentials_json=account.credentials_json,
            video_path=clip.file_path,
            title=title,
            description=description,
            tags=tags,
            category=category,
            privacy=privacy,
            make_shorts=make_shorts,
            thumbnail_path=thumbnail_path
        )
        
        if result['success']:
            # Update clip with upload info
            clip.is_uploaded = True
            clip.youtube_video_id = result['video_id']
            clip.youtube_url = result.get('shorts_url') or result.get('video_url')
            clip.uploaded_at = datetime.utcnow()
            clip.upload_error = None
            
            # Update account last used
            account.last_used_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                'message': 'Clip uploaded successfully',
                'video_id': result['video_id'],
                'video_url': result.get('video_url'),
                'shorts_url': result.get('shorts_url'),
                'thumbnail_uploaded': result.get('thumbnail_uploaded', False)
            }), 200
        else:
            # Update clip with error
            clip.upload_error = result.get('error', 'Upload failed')
            db.session.commit()
            
            return jsonify({
                'error': 'Upload failed',
                'message': result.get('error', 'Unknown error')
            }), 500
    
    except Exception as e:
        print(f"Error uploading clip: {e}")
        import traceback
        traceback.print_exc()
        
        clip.upload_error = str(e)
        db.session.commit()
        
        return jsonify({
            'error': 'Upload failed',
            'message': str(e)
        }), 500

