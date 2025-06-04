# 🛍️ nekuda AI Shopping Assistant Demo

A modern e-commerce demonstration showcasing AI-powered shopping assistance with **nekuda SDK** payment integration, and browser automation for seamless checkout experiences.

## 🌟 Features

### 🤖 AI Shopping Assistant
- **Natural Language Shopping**: Chat with AI to browse products, search, and add items to cart
- **CopilotKit Integration**: Powerful AI actions for seamless user experience
- **Smart Product Search**: Find products by name, description, or category
- **Cart Management**: Add, remove, and view cart items through conversation

### 💳 Advanced Payment Processing
- **nekuda SDK Integration**: Real cryptocurrency payment processing
- **Browser Automation**: AI-powered automated checkout process
- **Multi-Service Architecture**: Separate services for store and payment processing

### 🎨 Modern UI/UX
- **React + TypeScript**: Type-safe modern frontend
- **Tailwind CSS**: Beautiful, responsive design
- **Real-time Updates**: Live cart and product state management
- **Mobile-Friendly**: Responsive design for all devices

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Store API      │    │ Checkout Service│
│  (React/Vite)   │◄──►│   (FastAPI)      │    │   (FastAPI)     │
│  Port: 3000     │    │   Port: 8000     │    │   Port: 8001    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CopilotKit    │    │  Product Catalog │    │ nekuda SDK +    │
│   AI Actions    │    │  (nekuda.json)   │    │Browser Automation│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Git**

### ⚡ Super Easy Setup (2 steps)

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd agent-demo
   
   # Copy the environment template
   cp .env.example .env
   
   # Edit .env with your nekuda SDK keys
   nano .env  # or use your preferred editor
   ```

2. **Run everything with one command**
   ```bash
   chmod +x run_scripts/start-all.sh
   ./run_scripts/start-all.sh
   ```

**That's it!** 🎉 The script will automatically:
- ✅ Create Python virtual environment
- ✅ Install all backend dependencies  
- ✅ Install all frontend dependencies
- ✅ Start all 3 services
- ✅ Show you the URLs to access

### 🔑 Environment Configuration

Edit your `.env` file with your API credentials:

```env
# Backend: nekuda SDK Configuration
NEKUDA_API_KEY=your_nekuda_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Frontend: CopilotKit Configuration (VITE_ prefix required for frontend)
VITE_NEKUDA_PUBLIC_KEY=your_nekuda_public_key
VITE_COPILOTKIT_PUBLIC_KEY=your_copilot_key


# Optional: Custom ports (defaults shown)
# PORT_FRONTEND=3000
# PORT_STORE_API=8000  
# PORT_CHECKOUT_SERVICE=8001
```

### 🌐 Access the Application

After running the start script, access:

- **Frontend**: http://localhost:3000 (or 5173)
- **Store API**: http://localhost:8000
- **Checkout Service**: http://localhost:8001

## 🎯 Usage Guide

### 💬 Chat Commands

Try these natural language commands with the AI assistant:

#### Product Browsing
- *"Show me all products"*
- *"What products do you have?"*
- *"Display your catalog"*

#### Search
- *"Search for t-shirts"*
- *"Find hoodies"*
- *"Show me accessories"*

#### Shopping Cart
- *"Add a nekuda t-shirt to my cart"*
- *"Add 2 hoodies"*
- *"View my cart"*
- *"Remove the hat from cart"*
- *"Clear my cart"*

#### Checkout
- *"Complete my purchase"*
- *"Checkout now"*
- *"Buy these items"*

### 🛍️ Available Products

- **nekuda T-Shirt** - Premium cotton t-shirt with nekuda logo ($10)
- **nekuda Hoodie** - Comfortable fleece hoodie ($18)
- **nekuda Hat** - Stylish nekuda hat ($12)
- **nekuda Beanie** - Cozy nekuda beanie ($12)

## 🔧 Technical Details

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **CopilotKit** for AI integration
- **nekuda React SDK** for payment processing

### Backend Stack
- **FastAPI** for REST APIs
- **Python 3.8+** runtime
- **Uvicorn** ASGI server
- **Browser automation** for checkout

### Key Components

#### Frontend
- `ShoppingCart.tsx` - Main shopping interface with AI actions
- `CopilotChatContainer.tsx` - AI chat interface
- `App.tsx` - Main application component

#### Backend Services
- **Store API** (`backend/store_api/`) - Product catalog and store data
- **Checkout Service** (`backend/checkout_service/`) - Payment processing and browser automation

## 🛠️ Development

### Adding New Products
Edit `backend/store_api/nekuda.json` to add new products:

```json
{
  "items": [
    {
      "id": "NK-005",
      "name": "New Product",
      "price": 25.0,
      "description": "Product description",
      "category": "apparel",
      "image_url": "https://example.com/image.jpg"
    }
  ]
}
```

### Custom AI Actions
Add new CopilotKit actions in `frontend/src/components/ShoppingCart.tsx`:

```typescript
useCopilotAction({
    name: "customAction",
    description: "Description of what this action does",
    parameters: [/* parameters */],
    handler: async (params) => {
        // Action logic
    },
});
```

### Manual Installation (Alternative)

If you prefer manual setup:

```bash
# Backend setup
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

# Frontend setup
cd frontend
npm install
cd ..

# Manual start (3 terminals)
source .venv/bin/activate && python backend/store_api/main.py
source .venv/bin/activate && python backend/checkout_service/main.py
cd frontend && npm run dev
```

## 🛑 Stopping Services

```bash
# Using stop script
./run_scripts/stop-all.sh

# Or press Ctrl+C in the terminal running the services
```

## 📚 API Documentation

### Store API Endpoints
- `GET /api/products` - Get all products
- `GET /health` - Health check
- `GET /` - API information

### Checkout Service Endpoints  
- `POST /api/browser-checkout` - Process payment with browser automation
- `GET /health` - Health check

## 🔒 Security Notes

- This is a **demonstration project** for development/testing
- Uses test credentials for nekuda SDK
- Not intended for production use without proper security measures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is for demonstration purposes. Please check with the maintainers for licensing details.

## 🆘 Troubleshooting

### Common Issues

**Missing .env file**
```bash
cp .env.example .env
# Edit .env with your actual API keys:
# - VITE_NEKUDA_API_KEY (for backend payments)
# - VITE_COPILOTKIT_PUBLIC_KEY (for frontend AI chat)
```

**Port conflicts**
```bash
# The start script automatically kills conflicting processes
# But you can manually check:
lsof -i :3000
lsof -i :8000  
lsof -i :8001
```

**Python/Node.js not found**
```bash
# Ensure you have the prerequisites installed:
python3 --version  # Should be 3.8+
node --version     # Should be 18+
npm --version
```

**Permission denied on start script**
```bash
chmod +x run_scripts/start-all.sh
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Ensure your `.env` file has valid nekuda SDK credentials
3. Verify Python 3.8+ and Node.js 18+ are installed
4. Review console logs for specific error details

---

**Happy Shopping with AI! 🛍️✨**
