#!/usr/bin/env bash
set -o errexit

# Install Node dependencies
npm install

# Create bin folder for the engine
mkdir -p bin

# Download the latest Linux binary
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp

# Set permissions
chmod a+rx bin/yt-dlp

# Verify version in build logs
echo "Verifying Engine Version:"
./bin/yt-dlp --version