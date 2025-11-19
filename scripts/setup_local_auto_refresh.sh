#!/bin/bash
# Setup auto-refresh of cookies to run LOCALLY and upload to server
# This is better because Playwright needs a real browser

EMAIL="youtubioviral@gmail.com"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "🔧 Setting up LOCAL auto-refresh..."
echo "=========================================="
echo ""
echo "This will configure a cron job to run on THIS machine (not server)"
echo "The script will:"
echo "  1. Generate fresh cookies locally (using your browser)"
echo "  2. Upload them to the server automatically"
echo "  3. Restart the backend container"
echo ""
echo "Email: $EMAIL"
echo "Project: $PROJECT_DIR"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Check if auto_refresh_cookies.py exists
if [ ! -f "$PROJECT_DIR/src/auto_refresh_cookies.py" ]; then
    echo "❌ Error: src/auto_refresh_cookies.py not found!"
    exit 1
fi

# Check if upload_cookies.sh exists
if [ ! -f "$PROJECT_DIR/scripts/upload_cookies.sh" ]; then
    echo "❌ Error: scripts/upload_cookies.sh not found!"
    exit 1
fi

# Create the cron command
CRON_CMD="0 */6 * * * cd $PROJECT_DIR && python3 src/auto_refresh_cookies.py --email $EMAIL --output cookies.txt --upload 2>&1 | logger -t youtube-cookie-refresh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "auto_refresh_cookies"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep "auto_refresh_cookies"
    echo ""
    read -p "Replace existing cron job? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove old cron job
        crontab -l 2>/dev/null | grep -v "auto_refresh_cookies" | crontab -
        echo "✅ Removed old cron job"
    else
        echo "Keeping existing cron job. Exiting."
        exit 0
    fi
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Auto-refresh configured successfully!"
    echo "=========================================="
    echo ""
    echo "Cron job will run every 6 hours."
    echo ""
    echo "To view cron jobs:"
    echo "  crontab -l"
    echo ""
    echo "To remove:"
    echo "  crontab -l | grep -v 'auto_refresh_cookies' | crontab -"
    echo ""
    echo "To test now:"
    echo "  python3 src/auto_refresh_cookies.py --email $EMAIL --output cookies.txt --upload"
    echo ""
else
    echo ""
    echo "❌ Error setting up cron job"
    exit 1
fi

