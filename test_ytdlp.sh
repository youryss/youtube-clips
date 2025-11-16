#!/bin/bash
# Test yt-dlp directly to see if the error occurs

TEST_URL="https://www.youtube.com/watch?v=FaoohSLIrt4"

echo "Testing yt-dlp with URL: $TEST_URL"
echo "=" | head -c 60 && echo ""

# Test 1: Basic info extraction without format
echo "Test 1: Basic info (extract_flat=True, no format)"
yt-dlp --extract-flat --skip-download --quiet --no-warnings "$TEST_URL" 2>&1 | head -20

echo ""
echo "=" | head -c 60 && echo ""

# Test 2: Full info without format
echo "Test 2: Full info (skip_download=True, no format)"
yt-dlp --skip-download --quiet --no-warnings "$TEST_URL" --print "%(title)s|%(duration)s|%(id)s" 2>&1

echo ""
echo "=" | head -c 60 && echo ""

# Test 3: With cookies if available
if [ -f "cookies.txt" ]; then
    echo "Test 3: With cookies.txt"
    yt-dlp --cookies cookies.txt --skip-download --quiet --no-warnings "$TEST_URL" --print "%(title)s|%(duration)s|%(id)s" 2>&1
else
    echo "Test 3: Skipped (cookies.txt not found)"
fi

