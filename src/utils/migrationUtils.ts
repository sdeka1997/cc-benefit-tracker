import type { Benefit, CreditCard, ResetFrequency } from '../types/index';
import { getDisplayBenefitName } from './stringUtils';

export const normalizeBenefit = (b: Benefit, cardIssuer: string): Benefit => {
  let freq = (b.frequency as string) === 'calendar_year' ? 'annually' : b.frequency;
  let unit = b.unit || '$';
  let name = getDisplayBenefitName(b.name);
  let totalAmount = b.totalAmount;
  let resetIntervalMonths = b.resetIntervalMonths;

  const lowercaseName = name.toLowerCase();

  // Global Entry / TSA PreCheck normalization
  if (lowercaseName.includes('global entry') || lowercaseName.includes('tsa precheck')) {
    freq = 'interval';
    if (!resetIntervalMonths) resetIntervalMonths = 48;
    unit = '$';
  } 
  // Companion Award normalization
  else if (lowercaseName.includes('companion award')) {
    freq = 'anniversary';
    if (!resetIntervalMonths) resetIntervalMonths = 12;
    unit = 'passes';
    totalAmount = 1; // Force to 1 pass
    if (!name.includes('25K')) {
      name = '25K Companion Award';
    }
  } 
  // Generic passes normalization
  else if (lowercaseName.includes('passes')) {
    unit = 'passes';
  } 
  // Venture X Travel Credit normalization
  else if (cardIssuer === 'Capital One' && lowercaseName.includes('travel credit')) {
    freq = 'anniversary';
    if (!resetIntervalMonths) resetIntervalMonths = 12;
    unit = '$';
  }

  return {
    ...b,
    name,
    unit,
    totalAmount,
    resetIntervalMonths,
    periodType: b.periodType || (freq === 'annually' || freq === 'anniversary' ? 'rolling' : 'calendar'),
    frequency: freq as ResetFrequency
  };
};

export const normalizeCard = (card: CreditCard): CreditCard => {
  return {
    ...card,
    isAnniversarySet: card.isAnniversarySet ?? true, // Assume existing cards had it set or don't need the glow
    benefits: card.benefits.map(b => normalizeBenefit(b, card.issuer))
  };
};
