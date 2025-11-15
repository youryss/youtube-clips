#!/usr/bin/env python3
"""
Database models
"""

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

from .user import User
from .youtube_account import YouTubeAccount
from .job import Job
from .clip import Clip
from .settings import UserSettings

__all__ = ['db', 'bcrypt', 'User', 'YouTubeAccount', 'Job', 'Clip', 'UserSettings']

