import type { Benefit, CreditCard, ResetFrequency } from '../types/index';
import { getDisplayBenefitName } from './stringUtils';
import { BENEFIT_NAMES, DEFAULT_INTERVALS } from '../constants';

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
    if (!resetIntervalMonths) resetIntervalMonths = DEFAULT_INTERVALS.GLOBAL_ENTRY;
    unit = '$';
    name = BENEFIT_NAMES.GLOBAL_ENTRY;
  } 
  // Companion Award normalization
  else if (lowercaseName.includes('companion award')) {
    freq = 'anniversary';
    if (!resetIntervalMonths) resetIntervalMonths = DEFAULT_INTERVALS.COMPANION_AWARD;
    unit = 'passes';
    totalAmount = 1; // Force to 1 pass
    name = BENEFIT_NAMES.COMPANION_AWARD;
  } 
  // Generic passes normalization
  else if (lowercaseName.includes('passes')) {
    unit = 'passes';
  } 
  // Venture X Travel Credit normalization
  else if (cardIssuer === 'Capital One' && lowercaseName.includes('travel credit')) {
    freq = 'anniversary';
    if (!resetIntervalMonths) resetIntervalMonths = DEFAULT_INTERVALS.ANNUAL_ROLLING;
    unit = '$';
    name = BENEFIT_NAMES.TRAVEL_CREDIT;
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
    isAnniversarySet: card.isAnniversarySet ?? true,
    benefits: card.benefits.map(b => normalizeBenefit(b, card.issuer))
  };
};
