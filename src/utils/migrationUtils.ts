import type { Benefit, CreditCard, ResetFrequency, PeriodType } from '../types/index';
import { getDisplayBenefitName } from './stringUtils';
import { BENEFIT_NAMES, BENEFIT_CONFIGS } from '../constants';
import { PREPOPULATED_CARDS } from '../data/prepopulatedCards';

/**
 * Normalizes a single benefit's structure and configuration.
 * Used as a fallback for custom cards or to ensure basic field integrity.
 */
export const normalizeBenefit = (b: Benefit, cardIssuer: string): Benefit => {
  let name = getDisplayBenefitName(b.name);
  const lowercaseName = name.toLowerCase();

  // 1. Initial defaults
  let freq = (b.frequency as string) === 'calendar_year' ? 'annually' : b.frequency;
  let unit = b.unit || '$';
  let totalAmount = b.totalAmount;
  let resetIntervalMonths = b.resetIntervalMonths;
  let periodType = b.periodType || (freq === 'annually' || freq === 'anniversary' ? 'rolling' : 'calendar');

  // 2. Identify known benefits by name to apply system configs
  let configKey: string | null = null;
  if (lowercaseName.includes('global entry') || lowercaseName.includes('tsa precheck')) {
    configKey = BENEFIT_NAMES.GLOBAL_ENTRY;
  } else if (lowercaseName.includes('companion award')) {
    configKey = BENEFIT_NAMES.COMPANION_AWARD;
  } else if (cardIssuer === 'Capital One' && lowercaseName.includes('travel credit')) {
    configKey = BENEFIT_NAMES.TRAVEL_CREDIT;
  } else if (lowercaseName.includes('hotel credit')) {
    configKey = BENEFIT_NAMES.HOTEL_CREDIT;
  }

  // 3. Apply centralized configuration if found
  if (configKey && BENEFIT_CONFIGS[configKey]) {
    const config = BENEFIT_CONFIGS[configKey];
    name = configKey; // Use standard constant name
    if (config.defaultAmount !== undefined) totalAmount = config.defaultAmount;
    if (config.frequency) freq = config.frequency;
    if (config.periodType) periodType = config.periodType;
    if (config.unit) unit = config.unit;
    if (config.resetIntervalMonths) resetIntervalMonths = config.resetIntervalMonths;
  }

  // 4. Specific fallback logic for unnamed but common perks
  if (!configKey && lowercaseName.includes('passes')) {
    unit = 'passes';
  }

  return {
    ...b,
    name,
    unit,
    totalAmount,
    resetIntervalMonths,
    periodType: periodType as PeriodType,
    frequency: freq as ResetFrequency
  };
};

/**
 * Normalizes a CreditCard object. 
 * If the card has a templateId, the template becomes the master source of truth
 * for the card's name, issuer, fee, and benefit list.
 */
export const normalizeCard = (card: CreditCard): CreditCard => {
  const templateId = card.templateId || (card as any).id; // Fallback for legacy data
  const template = PREPOPULATED_CARDS.find(p => p.id === templateId);

  // 1. Basic field initialization (ensure required fields exist)
  const annualFeeDate = card.annualFeeDate || (card as any).anniversaryDate || new Date().toISOString();
  const isAnnualFeeDateSet = card.isAnnualFeeDateSet ?? (card as any).isAnniversarySet ?? true;

  // 2. If no template exists (Custom Card), just perform basic normalization
  if (!template) {
    return {
      ...card,
      annualFeeDate,
      isAnnualFeeDateSet,
      benefits: card.benefits.map(b => normalizeBenefit(b, card.issuer))
    };
  }

  // 3. TEMPLATE SYNC (Master List Logic)
  // We reconstruct the benefit list based on the template.
  const syncedBenefits = template.benefits.map(templateBenefit => {
    const templateName = templateBenefit.name.toLowerCase();
    
    // Find matching existing benefit by name
    const existingBenefit = card.benefits.find(b => {
      const bName = b.name.toLowerCase();
      const bDisplayName = getDisplayBenefitName(b.name).toLowerCase();
      return bName === templateName || bDisplayName === templateName;
    });

    if (existingBenefit) {
      // MERGE: Keep user data (id, usages, expiration), take configuration from template
      return {
        ...existingBenefit,
        name: templateBenefit.name,
        totalAmount: templateBenefit.totalAmount,
        frequency: templateBenefit.frequency,
        periodType: templateBenefit.periodType,
        resetIntervalMonths: templateBenefit.resetIntervalMonths,
        unit: templateBenefit.unit,
        category: templateBenefit.category,
        isCustom: false,
        // Carry over expiration logic
        expirationDate: existingBenefit.expirationDate || existingBenefit.issueDate || (card as any).anniversaryDate || annualFeeDate,
        isExpirationSet: existingBenefit.isExpirationSet ?? (card as any).isAnniversarySet ?? false
      };
    }
    
    // ADD: New benefit from template the user doesn't have yet
    return { ...templateBenefit, isCustom: false };
  });

  // 4. Return the card fully synchronized with its template
  return {
    ...card,
    templateId: template.id,
    name: template.name,
    issuer: template.issuer,
    annualFeeAmount: template.annualFeeAmount,
    annualFeeDate,
    isAnnualFeeDateSet,
    benefits: syncedBenefits
  };
};
