export interface PurchaseError {
  type: 'automation' | 'payment' | 'network' | 'timeout' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
}

export const classifyError = (error: any): PurchaseError => {
  const errorMessage = error?.message || error?.error || String(error);
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('fetch') || lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return {
      type: 'network',
      message: 'Cannot connect to checkout service',
      details: errorMessage,
      recoverable: true
    };
  }

  if (lowerMessage.includes('automation') || lowerMessage.includes('browser')) {
    return {
      type: 'automation',
      message: 'Browser automation failed',
      details: errorMessage,
      recoverable: true
    };
  }

  if (lowerMessage.includes('payment') || lowerMessage.includes('nekuda') || lowerMessage.includes('sdk')) {
    return {
      type: 'payment',
      message: 'Payment processing failed',
      details: errorMessage,
      recoverable: true
    };
  }

  if (lowerMessage.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Purchase timed out',
      details: errorMessage,
      recoverable: true
    };
  }

  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    details: errorMessage,
    recoverable: true
  };
};

export const getErrorMessage = (error: PurchaseError): string => {
  switch (error.type) {
    case 'network':
      return `❌ Connection Error: ${error.message}

🔧 Please ensure:
• The checkout service is running on http://localhost:8001
• Run: cd backend/checkout_service && python main.py
• Check for any firewall or network issues

Your cart has been preserved.`;

    case 'automation':
      return `❌ Browser Automation Error: ${error.message}

🔧 Troubleshooting:
• Ensure the automation service is running
• Check browser permissions
• Try again in a few moments

Your cart has been preserved.`;

    case 'payment':
      return `❌ Payment Processing Error: ${error.message}

💳 Please check:
• Your nekuda SDK credentials
• Payment method validity
• Account balance

Your cart has been preserved.`;

    case 'timeout':
      return `⏱️ Purchase Timeout: ${error.message}

The purchase is taking longer than expected. 
Your cart has been preserved. Please try again later.`;

    default:
      return `❌ Purchase Failed: ${error.message}

🔄 Your cart has been preserved. 
Please try again or contact support if the issue persists.`;
  }
};

export const formatErrorForHistory = (error: PurchaseError): string => {
  const timestamp = new Date().toLocaleTimeString();
  return `❌ Failed Order (${timestamp}): ${error.message} - ${error.details || 'No details'}`;
};