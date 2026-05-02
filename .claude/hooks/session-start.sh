#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

echo '{"async": true, "asyncTimeout": 300000}'

# Install dependencies
npm install

# Write API key to .env.local using the session token
SESSION_TOKEN_FILE="/home/claude/.claude/remote/.session_ingress_token"
if [ -f "$SESSION_TOKEN_FILE" ]; then
  printf 'ANTHROPIC_API_KEY=%s\n' "$(cat "$SESSION_TOKEN_FILE")" > .env.local
fi

# Start the dev server in the background if not already running
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
  npm run dev -- --hostname 0.0.0.0 --port 3000 &>/tmp/next-dev.log &
  # Wait up to 30s for server to be ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
      break
    fi
    sleep 1
  done
fi
