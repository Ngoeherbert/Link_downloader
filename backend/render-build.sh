#!/usr/bin/env bash
set -o errexit

# 1. Ensure Poetry is in the PATH for this build session
export PATH="/opt/render/project/poetry/bin:$PATH"

# 2. Install Node dependencies
npm install

# 3. Create the bin folder
mkdir -p bin

# 4. Download the actual Linux binary (Note the specific URL)
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o bin/yt-dlp

# 5. Set executable permissions
chmod a+rx bin/yt-dlp

# 6. VERIFY: If this fails, the build will stop (saving you from a broken deploy)
echo "Verifying Engine Version:"
./bin/yt-dlp --version