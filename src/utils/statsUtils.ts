import type { CreditCard } from '../types/index';
import { calculateCurrentUsedAmount, getDaysRemaining } from './dateUtils';

export interface DashboardStats {
  lifetimeSavings: number;
  availableToday: number;
  nextExpiryDays: number | null;
}

export const calculateDashboardStats = (cards: CreditCard[]): DashboardStats => {
  const lifetimeSavings = cards.reduce((acc, card) => 
    acc + card.benefits.reduce((bAcc, b) => 
      bAcc + b.usages.reduce((uAcc, u) => uAcc + u.amount, 0), 0), 0
  );

  const availableToday = cards.reduce((acc, card) => 
    acc + card.benefits.reduce((bAcc, b) => {
      const isMonetary = !b.unit || b.unit === '$';
      if (!isMonetary) return bAcc;
      const remaining = b.totalAmount - calculateCurrentUsedAmount(b, card.anniversaryDate);
      return bAcc + Math.max(0, remaining);
    }, 0), 0
  );

  const allBenefits = cards.flatMap(card => card.benefits.map(b => ({ 
    ...b, 
    anniversaryDate: card.anniversaryDate 
  })));

  const nextExpiryBenefit = allBenefits
    .filter(b => (b.totalAmount - calculateCurrentUsedAmount(b, b.anniversaryDate)) > 0)
    .sort((a, b) => getDaysRemaining(a, a.anniversaryDate) - getDaysRemaining(b, b.anniversaryDate))[0];

  const nextExpiryDays = nextExpiryBenefit ? getDaysRemaining(nextExpiryBenefit, nextExpiryBenefit.anniversaryDate) : null;

  return {
    lifetimeSavings,
    availableToday,
    nextExpiryDays
  };
};
