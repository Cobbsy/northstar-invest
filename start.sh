#!/bin/bash
# NorthStar Invest — start both servers

echo "Starting NorthStar Invest..."

# Backend
(cd "$(dirname "$0")/backend" && venv/bin/uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# Frontend
(eval "$(/opt/homebrew/bin/brew shellenv zsh)" && cd "$(dirname "$0")" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
