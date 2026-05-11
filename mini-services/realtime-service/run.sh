#!/bin/bash
while true; do
  cd /home/z/my-project/mini-services/realtime-service
  bun index.ts
  echo "Service crashed, restarting in 2s..."
  sleep 2
done
