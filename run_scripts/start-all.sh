#!/bin/bash

# Auto-setup and start all services for the agent-demo project

# Parse command line arguments
CLEAN_INSTALL=false
for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN_INSTALL=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--clean] [--help]"
            echo ""
            echo "Options:"
            echo "  --clean    Remove existing .venv and node_modules for fresh install"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Nekuda AI Shopping Assistant - Auto Setup & Start"
echo "=================================================="

# Clean installation if requested
if [ "$CLEAN_INSTALL" = true ]; then
    echo "🧹 Clean install requested - removing existing dependencies..."
    if [ -d ".venv" ]; then
        echo "🗑️  Removing .venv directory..."
        rm -rf .venv
        echo "✅ .venv directory removed"
    fi
    if [ -d "frontend/node_modules" ]; then
        echo "🗑️  Removing frontend/node_modules directory..."
        rm -rf frontend/node_modules
        echo "✅ node_modules directory removed"
    fi
    if [ -d "frontend/node_modules/.vite" ] || [ -d "frontend/dist" ] || [ -d "frontend/.vite" ]; then
        echo "🗑️  Removing frontend Vite caches and build files..."
        rm -rf frontend/node_modules/.vite
        rm -rf frontend/dist  
        rm -rf frontend/.vite
        echo "✅ Frontend Vite caches and build files removed"
    fi
    echo ""
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Please create a .env file with your configuration:"
    echo "   NEKUDA_API_KEY=your_nekuda_api_key_here"
    echo "   NEKUDA_MERCHANT_ID=your_merchant_id_here"
    echo "   # Add other environment variables as needed"
    echo ""
    read -p "Continue without .env file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Please create .env file and try again."
        exit 1
    fi
fi

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Check if Python virtual environment exists, create if not
if [ ! -d ".venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment. Please ensure Python 3.8+ is installed."
        exit 1
    fi
    echo "✅ Virtual environment created successfully!"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source .venv/bin/activate

# Install/Update checkout service dependencies
echo "📦 Installing/Updating checkout service dependencies..."
pip install -r backend/checkout_service/requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install checkout service dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed!"

# Install playwright browsers
echo "🌐 Installing Playwright browsers..."
playwright install
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Failed to install Playwright browsers, browser automation may not work"
else
    echo "✅ Playwright browsers installed!"
fi

# Check if frontend node_modules exist, install if not
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies. Please ensure Node.js 18+ is installed."
        exit 1
    fi
    cd ..
    echo "✅ Frontend dependencies installed!"
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "🚀 Starting all services..."
echo "=========================="

# Start Store API (port 8000)
echo "📦 Starting Store API on port 8000..."
./.venv/bin/python ./backend/store_api/main.py &
STORE_API_PID=$!

# Start Checkout Service (port 8001)
echo "💳 Starting Checkout Service on port 8001..."
./.venv/bin/python ./backend/checkout_service/main.py &
CHECKOUT_PID=$!

# Start Frontend (port 3000 or 5173)
echo "🌐 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for services to start
sleep 3

echo ""
echo "✅ All services started successfully!"
echo "===================================="
echo ""
echo "📍 Service URLs:"
echo "   • Frontend:         http://localhost:3000 (or 5173)"
echo "   • Store API:        http://localhost:8000"
echo "   • Checkout Service: http://localhost:8001"
echo ""
echo "🔧 Process IDs:"
echo "   • Store API:        $STORE_API_PID"
echo "   • Checkout Service: $CHECKOUT_PID"
echo "   • Frontend:         $FRONTEND_PID"
echo ""
echo "💬 Try these commands with the AI assistant:"
echo "   • 'Show me all products'"
echo "   • 'Add a nekuda t-shirt to my cart'"
echo "   • 'Complete my purchase'"
echo ""
echo "💡 To stop all services, press Ctrl+C or run: ./run_scripts/stop-all.sh"

# Function to cleanup when script is terminated
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $STORE_API_PID 2>/dev/null || true
    kill $CHECKOUT_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script termination
trap cleanup SIGINT SIGTERM

# Keep script running
wait 