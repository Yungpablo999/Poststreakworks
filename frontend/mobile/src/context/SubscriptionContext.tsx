import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type SubscriptionTier = 'free' | 'pro' | 'founding';

export type ProFeature =
  | 'one_click_repurpose'
  | 'unlimited_ai_scripts'
  | 'platform_earnings_breakdown'
  | 'dynamic_rate_card'
  | 'premium_passport_analytics'
  | 'unlimited_connected_platforms'
  | 'priority_brand_matching';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPro: boolean;
  isFounding: boolean;
  canAccess: (feature: ProFeature) => boolean;
  upgradeToPro: (targetTier?: 'pro' | 'founding') => void;
  downgradeToFree: () => void;
  toggleTier: () => void;
  isProModalVisible: boolean;
  openProModal: () => void;
  closeProModal: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{
  children: React.ReactNode;
  initialTier?: SubscriptionTier;
  onTierChange?: (newTier: SubscriptionTier) => void;
}> = ({ children, initialTier = 'free', onTierChange }) => {
  const [tier, setTier] = useState<SubscriptionTier>(initialTier);
  const [isProModalVisible, setIsProModalVisible] = useState(false);

  useEffect(() => {
    if (initialTier && initialTier !== tier) {
      setTier(initialTier);
    }
  }, [initialTier]);

  const isPro = tier === 'pro' || tier === 'founding';
  const isFounding = tier === 'founding';

  const canAccess = (feature: ProFeature): boolean => {
    if (isPro) return true;
    return false;
  };

  const upgradeToPro = (targetTier: 'pro' | 'founding' = 'pro') => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTier(targetTier);
    if (onTierChange) {
      onTierChange(targetTier);
    }
  };

  const downgradeToFree = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTier('free');
    if (onTierChange) {
      onTierChange('free');
    }
  };

  const toggleTier = () => {
    if (isPro) {
      downgradeToFree();
    } else {
      upgradeToPro('pro');
    }
  };

  const openProModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsProModalVisible(true);
  };

  const closeProModal = () => {
    setIsProModalVisible(false);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isPro,
        isFounding,
        canAccess,
        upgradeToPro,
        downgradeToFree,
        toggleTier,
        isProModalVisible,
        openProModal,
        closeProModal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
