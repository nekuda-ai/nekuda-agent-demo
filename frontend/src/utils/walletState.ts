// Wallet state management utilities
export const walletStateKey = 'nekuda_wallet_token';

export const saveWalletToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(walletStateKey, token);
    }
};

export const getWalletToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem(walletStateKey);
    }
    return null;
};

export const clearWalletToken = (): void => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(walletStateKey);
    }
};

export const hasWalletToken = (): boolean => {
    return getWalletToken() !== null;
};