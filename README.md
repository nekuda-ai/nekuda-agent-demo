# nekuda Shopping Agent Demo
![nekuda-logo](https://github.com/user-attachments/assets/a5eba1c5-7d59-4711-906f-fd2125713c77)

A commerce agent using the **nekuda SDK** to store credit cards and complete checkouts in the nekuda merchandise store. You can run it in under 2 minutes and see a full end-to-end example of an agent completing checkouts with a credit card using nekuda.

📚 **to learn more about nekuda SDK documentation, visit [docs.nekuda.ai](https://docs.nekuda.ai)**

If you’re building agents, you can use this code as a template to embed agentic payments in your agent.

**Feedback welcome: founders@nekuda.ai**

## Features
### 🤖 AI Shopping Assistant
- **Chat Shopping**: Browse and add items via chat
- **CopilotKit**: AI actions for smoother UX
- **Smart Search**: Find by name, description, or category
- **Cart Control**: Add, remove, or view items via chat

### 💳 Payment System
- **Credit Card Handling**: Collect credit cards with [nekuda SDK](https://docs.nekuda.ai/introduction). Stores transactions and data in the [nekuda dashboard](https://app.nekuda.ai/dashboard).
- **Checkout Agent**: Cart is sent as a payment intent to a browser agent that completes the purchase.

## 🏗️ Architecture
- **Modular Design**: Frontend, backend, and checkout are decoupled.


```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Store API      │    │ Checkout Service│
│  (React/Vite)   │◄──►│   (FastAPI)      │    │   (FastAPI)     │
│  Port: 3000     │    │   Port: 8000     │    │   Port: 8001    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   CopilotKit    │    │  Product Catalog │    │ nekuda SDK +     │
│   AI Actions    │    │  (nekuda.json)   │    │Browser Automation│
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Git**
- **nekuda API keys** (from [app.nekuda.ai](https://app.nekuda.ai))
- **CopilotKit API key** (from [cloud.copilotkit.ai](https://cloud.copilotkit.ai/dashboard))
- **OpenAI API key** (from [platform.openai.com](https://platform.openai.com))

### ⚡ Super Easy Setup (2 steps)

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd nekuda-agent-copilot-demo

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
NEKUDA_API_KEY=your_nekuda_api_key          # Private key from app.nekuda.ai
OPENAI_API_KEY=your_openai_api_key

# Frontend: CopilotKit Configuration (VITE_ prefix required for frontend)
VITE_NEKUDA_PUBLIC_KEY=your_nekuda_public_key    # Public key from app.nekuda.ai
VITE_COPILOTKIT_PUBLIC_KEY=your_copilot_key      # From cloud.copilotkit.ai/dashboard

# Optional: Alternative LLM providers for browser automation
# ANTHROPIC_API_KEY=your_anthropic_api_key
# GOOGLE_API_KEY=your_google_api_key

# Optional: Custom ports (defaults shown)
# PORT_FRONTEND=3000
# PORT_STORE_API=8000
# PORT_CHECKOUT_SERVICE=8001
```

#### Where to get your API keys:
- **nekuda keys**: Go to [app.nekuda.ai](https://app.nekuda.ai)
  - `VITE_NEKUDA_PUBLIC_KEY`: Your public key (for frontend)
  - `NEKUDA_API_KEY`: Your private key (for backend)
- **CopilotKit**: Get from [cloud.copilotkit.ai/dashboard](https://cloud.copilotkit.ai/dashboard)
- **OpenAI**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic** (optional): Get from [console.anthropic.com](https://console.anthropic.com)
- **Google** (optional): Get from [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### 🤖 Browser Automation Model Configuration

The checkout browser automation supports multiple LLM providers. To change the model:

1. **Default (OpenAI)** - Works reliably, easy to set up
2. **Gemini** - Fastest performance in testing
3. **Anthropic** - Alternative option

To switch models, edit `backend/checkout_service/nekuda_browser_automation.py` line 107:
```python
model_type = "gemini"  # Options: "openai", "gemini", "anthropic"
```

**Note:** Remember to set the corresponding API key in your `.env` file.

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

### Store Configuration
This demo uses a simple JSON file (`backend/store_api/nekuda.json`) to define the product catalog, making it easy to modify inventory without database setup. You can create multiple store JSON files for different catalogs, or integrate with external APIs and discovery services to dynamically load product data from existing e-commerce platforms or inventory management systems.

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


## 📝 License

This project is licensed under the MIT License.

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


---

