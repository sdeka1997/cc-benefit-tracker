import type { CreditCard, Benefit } from '../types/index';
import { getDaysRemaining, calculateCurrentUsedAmount } from './dateUtils';
import { getDisplayCardName } from './stringUtils';
import { EXPIRY_GROUPS, EXPIRY_ORDER } from '../constants';

export interface GroupedBenefits {
  [key: string]: (Benefit & { cardName: string; cardId: string; anniversaryDate: string })[];
}

export const groupBenefitsByExpiry = (cards: CreditCard[]): GroupedBenefits => {
  const allBenefits = cards.flatMap(card => card.benefits.map(b => ({ 
    ...b, 
    cardName: getDisplayCardName(card.name, card.issuer), 
    cardId: card.id, 
    anniversaryDate: card.anniversaryDate 
  })));
  
  const groups = allBenefits.reduce((acc, b) => {
    const days = getDaysRemaining(b, b.anniversaryDate);
    const isUsed = (b.totalAmount - calculateCurrentUsedAmount(b, b.anniversaryDate)) <= 0;
    
    let group: string = EXPIRY_GROUPS.LATER;
    if (isUsed) group = EXPIRY_GROUPS.FULLY_USED;
    else if (days <= 7) group = EXPIRY_GROUPS.SOON;
    else if (days <= 30) group = EXPIRY_GROUPS.MONTH;
    else if (days <= 90) group = EXPIRY_GROUPS.QUARTER;
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(b);
    return acc;
  }, {} as GroupedBenefits);

  // Ensure consistent order
  const orderedGroups: GroupedBenefits = {};
  EXPIRY_ORDER.forEach(key => {
    if (groups[key]) orderedGroups[key] = groups[key];
  });
  
  return orderedGroups;
};

export const groupBenefitsByCategory = (cards: CreditCard[]): GroupedBenefits => {
  const allBenefits = cards.flatMap(card => card.benefits.map(b => ({ 
    ...b, 
    cardName: getDisplayCardName(card.name, card.issuer), 
    cardId: card.id, 
    anniversaryDate: card.anniversaryDate 
  })));

  return allBenefits.reduce((acc, b) => {
    const cat = b.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {} as GroupedBenefits);
};

export const groupBenefitsByCard = (cards: CreditCard[]): GroupedBenefits => {
  return cards.reduce((acc, card) => {
    const displayName = getDisplayCardName(card.name, card.issuer);
    const groupKey = `${card.id}|${displayName}`;
    acc[groupKey] = card.benefits.map(b => ({ 
      ...b, 
      cardName: displayName, 
      cardId: card.id, 
      anniversaryDate: card.anniversaryDate 
    }));
    return acc;
  }, {} as GroupedBenefits);
};
