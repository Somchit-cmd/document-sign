#!/bin/bash
# Kill any existing Next.js process on port 3000
fuser -k 3000/tcp 2>/dev/null
sleep 1
cd /home/z/my-project
# Start the dev server
nohup bun run dev >> /home/z/my-project/dev.log 2>&1 &
