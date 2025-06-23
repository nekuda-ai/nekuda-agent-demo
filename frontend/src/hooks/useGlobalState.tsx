import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Stage = 
  | "shopping"
  | "collectPayment" 
  | "completePurchase";

interface GlobalStateContextType {
  // Stage management
  stage: Stage;
  setStage: (stage: Stage) => void;
  
  // Payment state
  paymentToken: string | null;
  setPaymentToken: (token: string | null) => void;
  
  // Purchase state
  lastPurchaseResult: any;
  setLastPurchaseResult: (result: any) => void;
  
  // Error state
  lastError: any;
  setLastError: (error: any) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("shopping");
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [lastPurchaseResult, setLastPurchaseResult] = useState<any>(null);
  const [lastError, setLastError] = useState<any>(null);

  const value = {
    stage,
    setStage,
    paymentToken,
    setPaymentToken,
    lastPurchaseResult,
    setLastPurchaseResult,
    lastError,
    setLastError,
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
}