import type { Benefit } from '../types/index';
import { calculateCurrentUsedAmount, getDaysRemaining, getPeriodEndDate } from './dateUtils';

export interface BenefitMetrics {
  currentUsedAmount: number;
  remaining: number;
  remainingPercent: number;
  percent: number;
  daysLeft: number;
  isFullyUsed: boolean;
  expiryDate: Date;
}

export const needsAnniversaryDate = (benefit: Benefit): boolean => {
  return benefit.frequency === 'anniversary';
};

export const calculateBenefitMetrics = (benefit: Benefit, anniversaryDate?: string): BenefitMetrics => {
  const currentUsedAmount = calculateCurrentUsedAmount(benefit, anniversaryDate);
  const remaining = Math.max(0, benefit.totalAmount - currentUsedAmount);
  const remainingPercent = (remaining / benefit.totalAmount) * 100;
  const percent = Math.min(100, (currentUsedAmount / benefit.totalAmount) * 100);
  const daysLeft = getDaysRemaining(benefit, anniversaryDate);
  const isFullyUsed = remaining <= 0;
  const expiryDate = getPeriodEndDate(benefit, anniversaryDate);

  return {
    currentUsedAmount,
    remaining,
    remainingPercent,
    percent,
    daysLeft,
    isFullyUsed,
    expiryDate
  };
};
