// Wallet state management utilities
const getUserWalletKey = (userId: string) => `nekuda_wallet_token_${userId}`;

export const saveWalletToken = (userId: string, token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(getUserWalletKey(userId), token);
    }
};

export const getWalletToken = (userId: string): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(getUserWalletKey(userId));
    }
    return null;
};

export const clearWalletToken = (userId: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(getUserWalletKey(userId));
    }
};

export const hasWalletToken = (userId: string): boolean => {
    return getWalletToken(userId) !== null;
};

// Check for existing saved cards and populate localStorage
export const checkAndSaveExistingCards = async (userId: string, apiService: any): Promise<void> => {
    try {
        const cards = await apiService.getAllCards(userId);
        if (cards && cards.length > 0) {
            // Save indication that user has cards (use default card ID or first card)
            const defaultCard = cards.find((card: any) => card.isDefault) || cards[0];
            saveWalletToken(userId, defaultCard.id);
            console.log('Found existing cards for user, saved to localStorage:', defaultCard.id);
        }
    } catch (error) {
        console.log('No existing cards found for user:', userId);
    }
};