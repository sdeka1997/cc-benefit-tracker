import type { CreditCard } from '../types/index';
import { calculateBenefitMetrics } from './benefitMetrics';

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
      const { remaining } = calculateBenefitMetrics(b, card.anniversaryDate);
      return bAcc + remaining;
    }, 0), 0
  );

  const allBenefits = cards.flatMap(card => card.benefits.map(b => ({ 
    ...b, 
    anniversaryDate: card.anniversaryDate 
  })));

  const nextExpiryBenefit = allBenefits
    .filter(b => calculateBenefitMetrics(b, b.anniversaryDate).remaining > 0)
    .sort((a, b) => calculateBenefitMetrics(a, a.anniversaryDate).daysLeft - calculateBenefitMetrics(b, b.anniversaryDate).daysLeft)[0];

  const nextExpiryDays = nextExpiryBenefit ? calculateBenefitMetrics(nextExpiryBenefit, nextExpiryBenefit.anniversaryDate).daysLeft : null;

  return {
    lifetimeSavings,
    availableToday,
    nextExpiryDays
  };
};
