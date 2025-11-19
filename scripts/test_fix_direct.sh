#!/bin/bash
# Direct test script - simpler approach

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

echo "🔍 Testing JavaScript Runtime Fix for yt-dlp"
echo "=============================================="
echo ""

# Create inline Python test script
PYTHON_TEST=$(cat <<'PYTHON_EOF'
import sys
import os

print("=" * 60)
print("Testing JavaScript Runtime Fix")
print("=" * 60)

# Check yt-dlp
try:
    import yt_dlp
    print(f"✅ yt-dlp installed")
    try:
        print(f"   Version: {yt_dlp.version.__version__}")
    except:
        print(f"   Version: {yt_dlp.__version__}")
except ImportError:
    print("❌ yt-dlp not installed")
    sys.exit(1)

# Check yt-dlp-ejs
try:
    import yt_dlp_ejs
    print(f"✅ yt-dlp-ejs installed")
except ImportError:
    print("⚠️  yt-dlp-ejs NOT installed - this is the problem!")
    print("   Installing yt-dlp[default]...")
    import subprocess
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'yt-dlp[default]'], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Installed yt-dlp[default]")
        try:
            import yt_dlp_ejs
            print(f"✅ yt-dlp-ejs now available")
        except:
            print("⚠️  Still can't import yt-dlp-ejs")
    else:
        print(f"❌ Installation failed: {result.stderr}")

# Check Node.js
import subprocess
try:
    result = subprocess.run(['node', '--version'], 
                          capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        print(f"✅ Node.js: {result.stdout.strip()}")
    else:
        print("⚠️  Node.js not accessible")
except Exception as e:
    print(f"⚠️  Node.js check failed: {e}")

# Test with cookies
print()
print("=" * 60)
print("Testing with cookies")
print("=" * 60)

cookie_file = "/app/cookies.txt"
test_url = "https://www.youtube.com/watch?v=Wtx3rb2ij8I"

if os.path.exists(cookie_file):
    print(f"✅ Cookie file exists: {os.path.getsize(cookie_file)} bytes")
else:
    print(f"⚠️  Cookie file not found: {cookie_file}")

try:
    ydl_opts = {
        'cookiefile': cookie_file,
        'quiet': False,
        'no_warnings': False,
    }
    
    ydl = yt_dlp.YoutubeDL(ydl_opts)
    info = ydl.extract_info(test_url, download=False)
    
    if info and info.get('title'):
        print(f"✅ SUCCESS! Title: {info.get('title')}")
        print(f"   Duration: {info.get('duration')} seconds")
        sys.exit(0)
    else:
        print("❌ FAILED: No info returned")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_EOF
)

# Use SSH with here-doc for cleaner execution
ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} <<SSH_EOF
cd ${SERVER_PATH}

echo "=== Current Status ==="
docker-compose exec -T backend python3 -c "import yt_dlp; print('yt-dlp version:', getattr(yt_dlp, '__version__', getattr(yt_dlp.version, '__version__', 'unknown')))" 2>&1 || echo "Could not get version"

echo ""
echo "=== Checking yt-dlp packages ==="
docker-compose exec -T backend pip list | grep yt-dlp

echo ""
echo "=== Node.js version ==="
docker-compose exec -T backend node --version 2>&1 || echo "Node.js not found"

echo ""
echo "=== Installing yt-dlp[default] ==="
docker-compose exec -T backend pip install --upgrade 'yt-dlp[default]' 2>&1 | tail -20

echo ""
echo "=== After installation ==="
docker-compose exec -T backend pip list | grep yt-dlp

echo ""
echo "=== Running test ==="
docker-compose exec -T backend python3 << 'PYTHON_TEST'
$PYTHON_TEST
PYTHON_TEST

SSH_EOF

echo ""
echo "✅ Test completed!"

