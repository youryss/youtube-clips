#!/usr/bin/env python3
"""
Configuration Module
Central configuration for YouTube Viral Clipper
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')

# Whisper Configuration
WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'small')  # tiny, base, small, medium, large
WHISPER_DEVICE = os.getenv('WHISPER_DEVICE', 'auto')  # cpu, cuda, auto
WHISPER_COMPUTE_TYPE = os.getenv('WHISPER_COMPUTE_TYPE', 'int8')  # int8, float16, float32

# Video Download Settings
VIDEO_QUALITY = os.getenv('VIDEO_QUALITY', '1080p')  # 1080p, 720p, 480p, best
TEMP_DIR = os.getenv('TEMP_DIR', 'temp')
OUTPUT_DIR = os.getenv('OUTPUT_DIR', 'output')

# Viral Clip Settings
MIN_CLIP_DURATION = int(os.getenv('MIN_CLIP_DURATION', '15'))  # seconds
MAX_CLIP_DURATION = int(os.getenv('MAX_CLIP_DURATION', '60'))  # seconds
CLIP_PADDING_BEFORE = float(os.getenv('CLIP_PADDING_BEFORE', '0.5'))  # seconds to add before
CLIP_PADDING_AFTER = float(os.getenv('CLIP_PADDING_AFTER', '0.5'))  # seconds to add after

# Analyzer Settings
MAX_CLIPS_PER_VIDEO = int(os.getenv('MAX_CLIPS_PER_VIDEO', '5'))
MIN_VIRAL_SCORE = float(os.getenv('MIN_VIRAL_SCORE', '7.0'))  # out of 10

# Criteria Configuration
CRITERIA_DIR = os.getenv('CRITERIA_DIR', 'criteria')
ACTIVE_CRITERIA = os.getenv('ACTIVE_CRITERIA', 'viral_hooks,emotional_peaks,value_bombs,humor_moments').split(',')

# Criteria weights (how important each criterion is)
CRITERIA_WEIGHTS = {
    'viral_hooks': 1.2,
    'emotional_peaks': 1.0,
    'value_bombs': 1.1,
    'humor_moments': 0.9,
}

# System Paths
PROJECT_ROOT = Path(__file__).parent.parent
TEMP_PATH = PROJECT_ROOT / TEMP_DIR
OUTPUT_PATH = PROJECT_ROOT / OUTPUT_DIR
CRITERIA_PATH = PROJECT_ROOT / CRITERIA_DIR

# Create necessary directories
TEMP_PATH.mkdir(exist_ok=True)
OUTPUT_PATH.mkdir(exist_ok=True)
CRITERIA_PATH.mkdir(exist_ok=True)


def validate_config() -> bool:
    """
    Validate that all required configuration is present
    
    Returns:
        True if configuration is valid, False otherwise
    """
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not set in environment variables")
        print("Please create a .env file with your OpenAI API key")
        return False
    
    return True


def get_criteria_file(criterion_name: str) -> Path:
    """
    Get the file path for a specific criterion
    
    Args:
        criterion_name: Name of the criterion (e.g., 'viral_hooks')
    
    Returns:
        Path to the criterion file
    """
    return CRITERIA_PATH / f"{criterion_name}.txt"


def load_criterion(criterion_name: str) -> str:
    """
    Load a criterion's content from file
    
    Args:
        criterion_name: Name of the criterion
    
    Returns:
        Content of the criterion file, or empty string if not found
    """
    file_path = get_criteria_file(criterion_name)
    if file_path.exists():
        return file_path.read_text(encoding='utf-8')
    return ""

