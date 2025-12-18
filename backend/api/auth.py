#!/usr/bin/env python3
"""
Authentication API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from models import db, User, UserSettings

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password') or not data.get('username'):
        return jsonify({'error': 'Email, username, and password are required'}), 400
    
    email = data['email'].lower().strip()
    username = data['username'].strip()
    password = data['password']
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400
    
    # Create new user
    user = User(email=email, username=username)
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Create default settings for user
    settings = UserSettings.create_default(user.id)
    db.session.add(settings)
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    import time
    import sys
    print(f"[LOGIN] Request received at {time.time()}", flush=True)
    sys.stdout.flush()
    
    try:
        data = request.get_json()
        print(f"[LOGIN] Data received: email={'present' if data and data.get('email') else 'missing'}", flush=True)
        sys.stdout.flush()
        
        if not data or not data.get('email') or not data.get('password'):
            print("[LOGIN] Missing email or password", flush=True)
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        print(f"[LOGIN] Processing login for: {email}", flush=True)
        sys.stdout.flush()
        
        # Find user
        user = User.query.filter_by(email=email).first()
        print(f"[LOGIN] User query completed: {'found' if user else 'not found'}", flush=True)
        sys.stdout.flush()
        
        if not user or not user.check_password(password):
            print("[LOGIN] Invalid credentials", flush=True)
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            print("[LOGIN] Account disabled", flush=True)
            return jsonify({'error': 'Account is disabled'}), 403
        
        print("[LOGIN] Generating tokens...", flush=True)
        sys.stdout.flush()
        # Generate tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        print("[LOGIN] Tokens generated", flush=True)
        sys.stdout.flush()
        
        print("[LOGIN] Creating response...", flush=True)
        sys.stdout.flush()
        user_dict = user.to_dict()
        print("[LOGIN] Response created, returning...", flush=True)
        sys.stdout.flush()
        
        return jsonify({
            'message': 'Login successful',
            'user': user_dict,
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
    except Exception as e:
        print(f"[LOGIN] ERROR: {e}", flush=True)
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        return jsonify({'error': 'Internal server error'}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    
    return jsonify({
        'access_token': access_token
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    # With JWT, logout is handled client-side by removing the token
    # Could implement token blacklist here if needed
    return jsonify({
        'message': 'Logout successful'
    }), 200

