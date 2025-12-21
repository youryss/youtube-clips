#!/usr/bin/env python3
"""
Main Flask Application
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flasgger import Swagger

from config import config
from models import db, bcrypt

# Initialize extensions
socketio = SocketIO()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_name=None):
    """Create and configure the Flask application"""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize configuration
    config[config_name].init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize Swagger
    # Get host and port from config or environment
    swagger_host = os.getenv('SWAGGER_HOST', 'localhost:5001')
    
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": "apispec",
                "route": "/apispec.json",
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/swagger"
    }
    
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "YouTube Viral Clipper API",
            "description": "API documentation for YouTube Viral Clipper - A service for creating viral video clips from YouTube videos",
            "version": "1.0.0",
            "contact": {
                "name": "API Support"
            }
        },
        "host": swagger_host,
        "basePath": "/api",
        "schemes": ["http", "https"],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            }
        },
        "security": [
            {
                "Bearer": []
            }
        ],
        "tags": [
            {
                "name": "Authentication",
                "description": "User authentication and authorization endpoints"
            },
            {
                "name": "Jobs",
                "description": "Video processing job management endpoints"
            },
            {
                "name": "Clips",
                "description": "Generated video clip management endpoints"
            },
            {
                "name": "Settings",
                "description": "User settings and configuration endpoints"
            },
            {
                "name": "YouTube",
                "description": "YouTube OAuth and upload endpoints"
            }
        ]
    }
    
    # Initialize Swagger with app (flasgger doesn't use init_app pattern)
    Swagger(app, config=swagger_config, template=swagger_template)
    
    # Initialize CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Initialize SocketIO
    socketio.init_app(
        app,
        cors_allowed_origins=app.config['SOCKETIO_CORS_ALLOWED_ORIGINS'],
        async_mode='eventlet'
    )
    
    # Register blueprints
    from api import auth_bp, jobs_bp, clips_bp, settings_bp, youtube_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(clips_bp, url_prefix='/api/clips')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(youtube_bp, url_prefix='/api/youtube')
    
    # Register WebSocket handlers
    from api import register_socket_events
    register_socket_events(socketio)
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy'}, 200
    
    # Root endpoint
    @app.route('/')
    def index():
        return {
            'name': 'YouTube Viral Clipper API',
            'version': '1.0.0',
            'status': 'running'
        }, 200
    
    return app


if __name__ == '__main__':
    app = create_app()
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Preload Whisper model for faster transcription
    try:
        from services.transcription_service import TranscriptionService
        TranscriptionService.initialize_model()
        print("Whisper model preloaded successfully")
    except Exception as e:
        print(f"Warning: Failed to preload Whisper model: {e}")
        print("Model will be loaded on first transcription request")
    
    # Start the job manager
    from services.job_manager import get_job_manager
    from models import Job
    
    job_manager = get_job_manager()
    print("Job manager initialized and running")
    
    # Re-queue any pending jobs (in case of restart)
    with app.app_context():
        pending_jobs = Job.query.filter_by(status='pending').all()
        if pending_jobs:
            print(f"Found {len(pending_jobs)} pending jobs, re-queueing...")
            for job in pending_jobs:
                job_manager.add_job(job.id, job.user_id)
                print(f"  Re-queued job {job.id}")
        else:
            print("No pending jobs to re-queue")
    
    # Run the application
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )

