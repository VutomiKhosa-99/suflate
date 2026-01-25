#!/bin/bash
# Development cron runner - polls scheduled posts every 30 seconds
# Usage: ./scripts/dev-cron.sh

echo "🕐 Starting development cron runner..."
echo "   Polling /api/cron/scheduled-posts every 30 seconds"
echo "   Press Ctrl+C to stop"
echo ""

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking scheduled posts..."
  result=$(curl -s "http://localhost:3002/api/cron/scheduled-posts" 2>&1)
  
  # Extract the JSON response (skip any HTML errors)
  if echo "$result" | grep -q '"success":true'; then
    processed=$(echo "$result" | grep -o '"processed":[0-9]*' | cut -d: -f2)
    posted=$(echo "$result" | grep -o '"posted":[0-9]*' | cut -d: -f2)
    if [ "$processed" != "0" ]; then
      echo "   ✅ Processed: $processed, Posted: $posted"
    else
      echo "   No posts due"
    fi
  elif echo "$result" | grep -q '"error"'; then
    echo "   ⚠️ Error: $(echo "$result" | grep -o '"error":"[^"]*"')"
  fi
  
  sleep 30
done
