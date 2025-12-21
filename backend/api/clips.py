#!/usr/bin/env python3
"""
Clips API endpoints
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Clip, Job
import os

clips_bp = Blueprint('clips', __name__)


@clips_bp.route('', methods=['GET'])
@jwt_required()
def list_clips():
    """
    List all clips for current user
    ---
    tags:
      - Clips
    summary: List all generated video clips
    description: Returns a paginated list of all clips for the authenticated user
    security:
      - Bearer: []
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
        description: Page number for pagination
      - in: query
        name: per_page
        type: integer
        default: 20
        description: Number of items per page
    responses:
      200:
        description: List of clips retrieved successfully
        schema:
          type: object
          properties:
            clips:
              type: array
              items:
                type: object
            total:
              type: integer
            page:
              type: integer
            per_page:
              type: integer
            pages:
              type: integer
    """
    user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Get clips from user's jobs
    query = Clip.query.join(Job).filter(Job.user_id == user_id).order_by(Clip.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'clips': [clip.to_dict() for clip in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@clips_bp.route('/<int:clip_id>', methods=['GET'])
@jwt_required()
def get_clip(clip_id):
    """
    Get clip details
    ---
    tags:
      - Clips
    summary: Get details of a specific clip
    description: Returns detailed information about a specific clip
    security:
      - Bearer: []
    parameters:
      - in: path
        name: clip_id
        type: integer
        required: true
        description: The ID of the clip to retrieve
    responses:
      200:
        description: Clip details retrieved successfully
        schema:
          type: object
          properties:
            clip:
              type: object
      404:
        description: Clip not found
    """
    user_id = int(get_jwt_identity())
    
    clip = Clip.query.join(Job).filter(
        Clip.id == clip_id,
        Job.user_id == user_id
    ).first()
    
    if not clip:
        return jsonify({'error': 'Clip not found'}), 404
    
    return jsonify({'clip': clip.to_dict()}), 200


@clips_bp.route('/<int:clip_id>/download', methods=['GET'])
@jwt_required()
def download_clip(clip_id):
    """Download clip file"""
    user_id = int(get_jwt_identity())
    
    clip = Clip.query.join(Job).filter(
        Clip.id == clip_id,
        Job.user_id == user_id
    ).first()
    
    if not clip:
        return jsonify({'error': 'Clip not found'}), 404
    
    if not os.path.exists(clip.file_path):
        return jsonify({'error': 'Clip file not found'}), 404
    
    return send_file(
        clip.file_path,
        as_attachment=True,
        download_name=clip.filename
    )


@clips_bp.route('/<int:clip_id>/thumbnail', methods=['GET'])
@jwt_required()
def get_thumbnail(clip_id):
    """Get clip thumbnail"""
    user_id = int(get_jwt_identity())
    
    clip = Clip.query.join(Job).filter(
        Clip.id == clip_id,
        Job.user_id == user_id
    ).first()
    
    if not clip or not clip.thumbnail_path:
        return jsonify({'error': 'Thumbnail not found'}), 404
    
    if not os.path.exists(clip.thumbnail_path):
        return jsonify({'error': 'Thumbnail file not found'}), 404
    
    return send_file(clip.thumbnail_path, mimetype='image/jpeg')


@clips_bp.route('/<int:clip_id>', methods=['DELETE'])
@jwt_required()
def delete_clip(clip_id):
    """Delete a clip"""
    user_id = int(get_jwt_identity())
    
    clip = Clip.query.join(Job).filter(
        Clip.id == clip_id,
        Job.user_id == user_id
    ).first()
    
    if not clip:
        return jsonify({'error': 'Clip not found'}), 404
    
    # TODO: Delete files from filesystem
    
    db.session.delete(clip)
    db.session.commit()
    
    return jsonify({'message': 'Clip deleted successfully'}), 200

