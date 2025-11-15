#!/usr/bin/env python3
"""
Settings API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, UserSettings
from pathlib import Path
import os

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    """Get user settings"""
    user_id = get_jwt_identity()
    
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    
    if not settings:
        # Create default settings
        settings = UserSettings.create_default(user_id)
        db.session.add(settings)
        db.session.commit()
    
    return jsonify({'settings': settings.to_dict()}), 200


@settings_bp.route('', methods=['PUT'])
@jwt_required()
def update_settings():
    """Update user settings"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    
    if not settings:
        settings = UserSettings.create_default(user_id)
        db.session.add(settings)
    
    # Update settings
    for key, value in data.items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Settings updated successfully',
        'settings': settings.to_dict()
    }), 200


@settings_bp.route('/criteria', methods=['GET'])
@jwt_required()
def get_criteria():
    """Get all criteria content"""
    # Get criteria directory path (relative to project root)
    project_root = Path(__file__).parent.parent.parent
    criteria_dir = project_root / 'criteria'
    
    if not criteria_dir.exists():
        return jsonify({'error': 'Criteria directory not found'}), 404
    
    criteria = {}
    criterion_names = ['viral_hooks', 'emotional_peaks', 'value_bombs', 'humor_moments']
    
    for criterion_name in criterion_names:
        criterion_file = criteria_dir / f"{criterion_name}.txt"
        if criterion_file.exists():
            try:
                content = criterion_file.read_text(encoding='utf-8')
                criteria[criterion_name] = content
            except Exception as e:
                print(f"Error reading {criterion_name}: {e}")
                criteria[criterion_name] = ""
        else:
            criteria[criterion_name] = ""
    
    return jsonify({'criteria': criteria}), 200


@settings_bp.route('/criteria/<criterion_name>', methods=['GET'])
@jwt_required()
def get_criterion(criterion_name: str):
    """Get a specific criterion's content"""
    # Get criteria directory path (relative to project root)
    project_root = Path(__file__).parent.parent.parent
    criteria_dir = project_root / 'criteria'
    
    if not criteria_dir.exists():
        return jsonify({'error': 'Criteria directory not found'}), 404
    
    # Validate criterion name
    valid_criteria = ['viral_hooks', 'emotional_peaks', 'value_bombs', 'humor_moments']
    if criterion_name not in valid_criteria:
        return jsonify({'error': 'Invalid criterion name'}), 400
    
    criterion_file = criteria_dir / f"{criterion_name}.txt"
    
    if not criterion_file.exists():
        return jsonify({'error': 'Criterion file not found'}), 404
    
    try:
        content = criterion_file.read_text(encoding='utf-8')
        return jsonify({
            'criterion': criterion_name,
            'content': content
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error reading criterion: {str(e)}'}), 500

