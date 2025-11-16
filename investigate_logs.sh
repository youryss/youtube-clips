#!/bin/bash

# Script to investigate backend logs on remote server
# Usage: ./investigate_logs.sh [options]

# Server configuration (can be overridden by environment variables)
SERVER_HOST="${SERVER_HOST:-164.90.193.41}"
SERVER_USER="${SERVER_USER:-root}"
# Password can be set via SERVER_PASS env var, or will use default
# For security, prefer: export SERVER_PASS="your-password"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"
SERVER_PATH="${SERVER_PATH:-~/youtube-viral-clipper}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
FOLLOW=false
LINES=100
FILTER=""
SEARCH=""
ERRORS_ONLY=false
USE_SSH_KEY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -e|--errors)
            ERRORS_ONLY=true
            shift
            ;;
        -s|--search)
            SEARCH="$2"
            shift 2
            ;;
        -k|--ssh-key)
            USE_SSH_KEY=true
            shift
            ;;
        -h|--host)
            SERVER_HOST="$2"
            shift 2
            ;;
        -u|--user)
            SERVER_USER="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -f, --follow          Follow log output (like tail -f)"
            echo "  -n, --lines N         Show last N lines (default: 100)"
            echo "  -e, --errors          Show only ERROR lines"
            echo "  -s, --search PATTERN  Search for specific pattern"
            echo "  -k, --ssh-key         Use SSH key instead of password"
            echo "  -h, --host HOST       Server host/IP (default: $SERVER_HOST)"
            echo "  -u, --user USER       SSH user (default: $SERVER_USER)"
            echo "  --help                Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  SERVER_HOST          Server IP/hostname"
            echo "  SERVER_USER          SSH username"
            echo "  SERVER_PASS          SSH password"
            echo "  SERVER_PATH          Path to project on server"
            echo ""
            echo "Examples:"
            echo "  $0                    # Show last 100 lines"
            echo "  $0 -f                 # Follow logs in real-time"
            echo "  $0 -e                 # Show only errors"
            echo "  $0 -s 'YT_DLP_COOKIES'  # Search for cookie-related logs"
            echo "  $0 -n 50 -e           # Last 50 lines, errors only"
            echo "  $0 -k                 # Use SSH key authentication"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check authentication method
USE_EXPECT=false
if [ "$USE_SSH_KEY" = false ]; then
    # Prefer expect over sshpass (more reliable)
    if command -v expect &> /dev/null; then
        USE_EXPECT=true
        echo -e "${GREEN}Using expect for password authentication${NC}"
    elif command -v sshpass &> /dev/null; then
        USE_EXPECT=false
        echo -e "${GREEN}Using sshpass for password authentication${NC}"
    else
        echo -e "${YELLOW}Warning: Neither sshpass nor expect found.${NC}"
        echo ""
        echo "Options:"
        echo "  1. Install sshpass:"
        echo "     macOS:   brew install hudochenkov/sshpass/sshpass"
        echo "     Linux:   apt-get install sshpass"
        echo ""
        echo "  2. Use SSH key authentication (recommended):"
        echo "     ssh-keygen -t rsa"
        echo "     ssh-copy-id $SERVER_USER@$SERVER_HOST"
        echo "     Then run: $0 -k"
        echo ""
        echo -e "${YELLOW}Falling back to interactive SSH (you'll need to enter password manually)${NC}"
        echo ""
        USE_EXPECT=false
    fi
fi

# Build docker-compose command
DOCKER_CMD="cd $SERVER_PATH && docker-compose logs"

if [ "$FOLLOW" = true ]; then
    DOCKER_CMD="$DOCKER_CMD -f"
fi

if [ "$LINES" != "0" ] && [ "$FOLLOW" = false ]; then
    DOCKER_CMD="$DOCKER_CMD --tail=$LINES"
fi

DOCKER_CMD="$DOCKER_CMD backend"

# Apply filters
if [ "$ERRORS_ONLY" = true ]; then
    DOCKER_CMD="$DOCKER_CMD 2>&1 | grep -i 'ERROR\|Exception\|Traceback\|Failed'"
elif [ -n "$SEARCH" ]; then
    DOCKER_CMD="$DOCKER_CMD 2>&1 | grep -i '$SEARCH'"
fi

# Build SSH command
if [ "$USE_SSH_KEY" = true ]; then
    SSH_CMD="ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST"
    FULL_CMD="$SSH_CMD \"$DOCKER_CMD\""
elif [ "$USE_EXPECT" = true ]; then
    # Use expect script for password authentication (most reliable)
    # Pass password via environment variable to avoid shell escaping issues
    TEMP_EXPECT=$(mktemp /tmp/investigate_logs_XXXXXX.exp)
    cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 30
set send_slow {1 .1}
log_user 1

# Get password from environment or use default
if {[info exists env(SERVER_PASS)]} {
    set password \$env(SERVER_PASS)
} else {
    set password "$SERVER_PASS"
}

spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "$DOCKER_CMD"
expect {
    timeout {
        puts stderr "Connection timeout"
        exit 1
    }
    -re "(?i)(password|Password):" {
        send -- "\$password\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    "(yes/no/\[fingerprint\])" {
        send "yes\r"
        exp_continue
    }
    "Permission denied" {
        puts stderr "Authentication failed - check password"
        exit 1
    }
    eof {
        catch wait result
        set exit_code [lindex \$result 3]
        if {\$exit_code == 0} {
            exit 0
        } else {
            exit \$exit_code
        }
    }
}
EXPECT_EOF
    chmod +x "$TEMP_EXPECT"
    # Export password to environment for expect
    export SERVER_PASS="$SERVER_PASS"
    FULL_CMD="expect -f \"$TEMP_EXPECT\""
    CLEANUP_EXPECT="$TEMP_EXPECT"
elif command -v sshpass &> /dev/null; then
    # Use sshpass if available
    SSH_CMD="sshpass -p '$SERVER_PASS' ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST"
    FULL_CMD="$SSH_CMD \"$DOCKER_CMD\""
else
    # Interactive SSH (user will enter password)
    SSH_CMD="ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST"
    FULL_CMD="$SSH_CMD \"$DOCKER_CMD\""
    echo -e "${YELLOW}You will be prompted for the password manually${NC}"
    echo ""
fi

echo -e "${BLUE}Connecting to: ${GREEN}$SERVER_USER@$SERVER_HOST${NC}"
echo -e "${BLUE}Path: ${GREEN}$SERVER_PATH${NC}"
echo -e "${BLUE}Command: ${GREEN}$DOCKER_CMD${NC}"
echo ""

# Execute command
if [ "$FOLLOW" = true ]; then
    # For follow mode, execute directly so Ctrl+C works
    eval $FULL_CMD
    EXIT_CODE=$?
else
    # For non-follow mode, capture output
    eval $FULL_CMD
    EXIT_CODE=$?
fi

# Cleanup temp expect script if created
if [ -n "$CLEANUP_EXPECT" ] && [ -f "$CLEANUP_EXPECT" ]; then
    rm -f "$CLEANUP_EXPECT"
fi

# Check exit code
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Error: Command failed with exit code $EXIT_CODE${NC}"
    exit $EXIT_CODE
fi

