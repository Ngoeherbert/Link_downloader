#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Node.js dependencies
npm install

# 2. Create a folder to hold our tools
mkdir -p bin

# 3. Download the Linux version of yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o bin/yt-dlp

# 4. Give the server permission to run the tool
chmod a+rx bin/yt-dlp

echo "Build complete: yt-dlp is installed and executable."