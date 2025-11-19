#!/usr/bin/env python3
"""
Check what dependencies are missing by trying to import them
"""
import sys

# All dependencies that should be available
required_modules = {
    # Backend Flask dependencies
    'flask': 'flask',
    'flask_socketio': 'flask-socketio',
    'flask_cors': 'flask-cors',
    'flask_sqlalchemy': 'flask-sqlalchemy',
    'psycopg2': 'psycopg2-binary',
    'flask_migrate': 'flask-migrate',
    'flask_jwt_extended': 'flask-jwt-extended',
    'flask_bcrypt': 'flask-bcrypt',
    'python_socketio': 'python-socketio',
    'eventlet': 'eventlet',
    'google.auth': 'google-auth',
    'google_auth_oauthlib': 'google-auth-oauthlib',
    'google_auth_httplib2': 'google-auth-httplib2',
    'dotenv': 'python-dotenv',
    'requests': 'requests',
    
    # Source code dependencies
    'yt_dlp': 'yt-dlp[default]',
    'yt_dlp_ejs': 'yt-dlp[default]',  # Included with yt-dlp[default]
    'openai': 'openai',
    'faster_whisper': 'faster-whisper',
    'googleapiclient': 'google-api-python-client',
    'tqdm': 'tqdm',
}

missing = []
available = []

for module_name, package_name in required_modules.items():
    try:
        # Try to import the module
        if '.' in module_name:
            # Handle dotted imports like google.auth
            parts = module_name.split('.')
            mod = __import__(parts[0])
            for part in parts[1:]:
                mod = getattr(mod, part)
        else:
            mod = __import__(module_name)
        available.append(f"✅ {module_name} ({package_name})")
    except ImportError as e:
        missing.append(f"❌ {module_name} ({package_name}) - {e}")

print("=" * 60)
print("Dependency Check Results")
print("=" * 60)
print()
print(f"Available ({len(available)}):")
for item in available:
    print(f"  {item}")
print()
print(f"Missing ({len(missing)}):")
for item in missing:
    print(f"  {item}")
print()
print("=" * 60)

if missing:
    print("\nMissing packages to install:")
    unique_packages = set([item.split('(')[1].split(')')[0] for item in missing])
    for pkg in sorted(unique_packages):
        print(f"  {pkg}")
    sys.exit(1)
else:
    print("\n✅ All dependencies are available!")
    sys.exit(0)

