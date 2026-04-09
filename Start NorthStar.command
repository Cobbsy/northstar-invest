#!/bin/bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"

# Go to the project folder
cd "/Users/coff/Internal Documents/Application Coding Programs/Investments/northstar-invest"

echo "============================================"
echo "  NorthStar Invest - Starting Up"
echo "============================================"
echo ""

# Start backend
echo "[1/2] Starting backend (stock data server)..."
(cd backend && venv/bin/uvicorn main:app --port 8000 2>&1) &
BACKEND_PID=$!
sleep 3

# Check backend started
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "      Backend ready at http://localhost:8000"
else
  echo "      Backend failed to start - check errors above"
fi

echo ""

# Start frontend
echo "[2/2] Starting frontend (the app)..."
npm run dev &
FRONTEND_PID=$!
sleep 3

echo ""
echo "============================================"
echo "  App is ready!"
echo "  Opening: http://localhost:5173"
echo "============================================"
echo ""
echo "Keep this window open while using the app."
echo "Press Ctrl+C to shut everything down."
echo ""

open http://localhost:5173

trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
