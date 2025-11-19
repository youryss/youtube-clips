#!/bin/bash
# Switch YouTube Account Helper Script

echo "🔄 YouTube Account Switcher"
echo "=" 
echo ""

# Check if token exists
if [ -f "youtube_token.json" ]; then
    echo "Current authenticated account found."
    echo ""
    echo "Options:"
    echo "1. Delete and re-authenticate (will show account chooser)"
    echo "2. Keep current account and cancel"
    echo ""
    read -p "Your choice (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo ""
        echo "🗑️  Deleting youtube_token.json..."
        rm youtube_token.json
        echo "✓ Token deleted"
        echo ""
        echo "📝 Instructions:"
        echo "1. The browser will open for authentication"
        echo "2. If it auto-selects an account, click your profile picture"
        echo "3. Click 'Use another account' or 'Add account'"
        echo "4. Sign in with the YouTube account you want to use"
        echo ""
        read -p "Press Enter to continue..."
        echo ""
        echo "🚀 Starting upload (will trigger authentication)..."
        source venv/bin/activate
        python src/upload_clips.py --dry-run
    else
        echo "Cancelled. No changes made."
        exit 0
    fi
else
    echo "No account is currently authenticated."
    echo ""
    echo "When the browser opens:"
    echo "• Sign in with the YouTube account you want to use"
    echo "• Make sure it's added as a Test User in Google Cloud Console"
    echo ""
    read -p "Press Enter to start authentication..."
    echo ""
    source venv/bin/activate
    python src/upload_clips.py --dry-run
fi

echo ""
echo "=" 
echo "Done! You can now upload videos."
echo "Run: python src/upload_clips.py -i"


