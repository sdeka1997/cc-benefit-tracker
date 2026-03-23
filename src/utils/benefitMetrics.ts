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

export const calculateBenefitMetrics = (benefit: Benefit, cardAnnualFeeDateStr?: string): BenefitMetrics => {
  const startDate = benefit.expirationDate 
    ? new Date(benefit.expirationDate) 
    : (cardAnnualFeeDateStr ? new Date(cardAnnualFeeDateStr) : new Date());
  
  // Ensure startDate is treated as local noon to avoid timezone shifts
  startDate.setHours(12, 0, 0, 0);

  const currentUsedAmount = calculateCurrentUsedAmount(benefit, startDate.toISOString());
  const remaining = Math.max(0, benefit.totalAmount - currentUsedAmount);
  const remainingPercent = (remaining / benefit.totalAmount) * 100;
  const percent = Math.min(100, (currentUsedAmount / benefit.totalAmount) * 100);
  const daysLeft = getDaysRemaining(benefit, startDate.toISOString());
  const isFullyUsed = remaining <= 0;
  const expiryDate = getPeriodEndDate(benefit, startDate.toISOString());

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
