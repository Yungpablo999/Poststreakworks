import React from 'react';
import { AppToast } from './ui/AppToast';

// Kept so older screens don't need to change: now renders the app's one
// frosted-glass confirmation message (AppToast).
interface BrandToastProps {
  message: string | null;
  bottom?: number;
}

export const BrandToast: React.FC<BrandToastProps> = ({ message, bottom }) => <AppToast message={message} bottom={bottom} />;
