import type { CreditCard, Benefit } from '../types/index';
import { calculateBenefitMetrics } from './benefitMetrics';
import { getDisplayCardName } from './stringUtils';
import { EXPIRY_GROUPS, EXPIRY_ORDER } from '../constants';

export interface GroupedBenefits {
  [key: string]: (Benefit & { cardName: string; cardId: string; annualFeeDate: string })[];
}

/**
 * Common sort function for benefits by name.
 */
const sortBenefitsByName = (a: Benefit, b: Benefit) => {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
};

export const groupBenefitsByExpiry = (cards: CreditCard[]): GroupedBenefits => {
  const allBenefits = cards.flatMap(card => card.benefits
    .filter(b => !b.isHidden)
    .map(b => ({ 
      ...b, 
      cardName: getDisplayCardName(card.name, card.issuer), 
      cardId: card.id, 
      annualFeeDate: card.annualFeeDate
    })));
  
  const groups = allBenefits.reduce((acc, b) => {
    const { daysLeft, isFullyUsed } = calculateBenefitMetrics(b, b.annualFeeDate);
    
    let group: string = EXPIRY_GROUPS.LATER;
    if (isFullyUsed) group = EXPIRY_GROUPS.FULLY_USED;
    else if (daysLeft <= 7) group = EXPIRY_GROUPS.SOON;
    else if (daysLeft <= 30) group = EXPIRY_GROUPS.MONTH;
    else if (daysLeft <= 90) group = EXPIRY_GROUPS.QUARTER;
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(b);
    return acc;
  }, {} as GroupedBenefits);

  // Ensure consistent group order and sort benefits within each group
  const orderedGroups: GroupedBenefits = {};
  EXPIRY_ORDER.forEach(key => {
    if (groups[key]) {
      orderedGroups[key] = groups[key].sort((a, b) => {
        const metricsA = calculateBenefitMetrics(a, a.annualFeeDate);
        const metricsB = calculateBenefitMetrics(b, b.annualFeeDate);
        
        // Primary sort: Days Remaining
        const daysDiff = metricsA.daysLeft - metricsB.daysLeft;
        if (daysDiff !== 0) return daysDiff;
        
        // Secondary sort: Alphabetical by benefit name
        return sortBenefitsByName(a, b);
      });
    }
  });
  
  return orderedGroups;
};

export const groupBenefitsByCategory = (cards: CreditCard[]): GroupedBenefits => {
  const allBenefits = cards.flatMap(card => card.benefits
    .filter(b => !b.isHidden)
    .map(b => ({ 
      ...b, 
      cardName: getDisplayCardName(card.name, card.issuer), 
      cardId: card.id, 
      annualFeeDate: card.annualFeeDate
    })));

  const groups = allBenefits.reduce((acc, b) => {
    let cat = b.category || 'Other';
    // Collapse specific travel categories into 'Travel' for main grouping
    if (['Air Travel', 'Lodging', 'Travel Credit'].includes(cat)) {
      cat = 'Travel';
    }
    
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {} as GroupedBenefits);

  // Alphabetize categories and sort benefits within each by name
  const sortedKeys = Object.keys(groups).sort();
  const sortedGroups: GroupedBenefits = {};
  sortedKeys.forEach(key => {
    sortedGroups[key] = groups[key].sort(sortBenefitsByName);
  });

  return sortedGroups;
};

export const groupBenefitsByCard = (cards: CreditCard[]): GroupedBenefits => {
  // Alphabetize cards by display name
  const sortedCards = [...cards].sort((a, b) => {
    const nameA = getDisplayCardName(a.name, a.issuer).toLowerCase();
    const nameB = getDisplayCardName(b.name, b.issuer).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return sortedCards.reduce((acc, card) => {
    const displayName = getDisplayCardName(card.name, card.issuer);
    const groupKey = `${card.id}|${displayName}`;
    
    // Sort benefits within this card alphabetically by name
    const activeBenefits = card.benefits
      .filter(b => !b.isHidden)
      .map(b => ({ 
        ...b, 
        cardName: displayName, 
        cardId: card.id, 
        annualFeeDate: card.annualFeeDate
      })).sort(sortBenefitsByName);
      
    if (activeBenefits.length > 0) {
      acc[groupKey] = activeBenefits;
    }
    
    return acc;
  }, {} as GroupedBenefits);
};
