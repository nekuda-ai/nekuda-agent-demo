// Simple stub for react-svg-credit-card-payment-icons to avoid build issues
import React from 'react';

export const PaymentIcon = ({ type, format, width = 32 }) => {
  // Return a simple div as placeholder for payment icon
  return React.createElement('div', {
    style: {
      width: width,
      height: Math.round(width * 0.625),
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      color: '#666',
    }
  }, type || 'CARD');
};

export default PaymentIcon;