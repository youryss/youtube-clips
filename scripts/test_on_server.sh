#!/bin/bash
# Test get_video_info directly on the server

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

TEST_URL="https://www.youtube.com/watch?v=FaoohSLIrt4"

if command -v expect &> /dev/null; then
    TEMP_EXPECT=$(mktemp /tmp/test_server_XXXXXX.exp)
    cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 60
spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker-compose exec -T backend python3 -c \"
import sys
sys.path.insert(0, '/app/src')
from download import get_video_info

url = '$TEST_URL'
print('Testing get_video_info with:', url)
print('=' * 60)

try:
    info = get_video_info(url)
    if info:
        print('SUCCESS! Video info retrieved:')
        print(f'  Title: {info.get(\\\"title\\\", \\\"N/A\\\")}')
        print(f'  Duration: {info.get(\\\"duration\\\", 0)} seconds')
        print(f'  ID: {info.get(\\\"id\\\", \\\"N/A\\\")}')
    else:
        print('FAILED: get_video_info returned None')
except Exception as e:
    print(f'ERROR: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
\""
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    eof
}
catch wait result
exit [lindex \$result 3]
EXPECT_EOF
    chmod +x "$TEMP_EXPECT"
    expect -f "$TEMP_EXPECT"
    rm -f "$TEMP_EXPECT"
else
    echo "expect not found. Please install it or use SSH key."
    exit 1
fi

