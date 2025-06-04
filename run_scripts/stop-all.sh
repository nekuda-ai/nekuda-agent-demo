#!/bin/bash

# Stop all services for the agent-demo project

echo "🛑 Stopping all services..."

# Kill processes on specific ports
echo "🧹 Cleaning up processes on ports 8000, 8001, 3000, 5173..."

lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "   ✅ Killed process on port 8000" || echo "   ℹ️  No process on port 8000"
lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "   ✅ Killed process on port 8001" || echo "   ℹ️  No process on port 8001"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✅ Killed process on port 3000" || echo "   ℹ️  No process on port 3000"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "   ✅ Killed process on port 5173" || echo "   ℹ️  No process on port 5173"

echo ""
echo "✅ All services stopped!" 