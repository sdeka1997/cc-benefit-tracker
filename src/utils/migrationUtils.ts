import type { Benefit, CreditCard, ResetFrequency, PeriodType } from '../types/index';
import { getDisplayBenefitName } from './stringUtils';
import { BENEFIT_NAMES, BENEFIT_CONFIGS } from '../constants';
import { PREPOPULATED_CARDS } from '../data/prepopulatedCards';

export const normalizeBenefit = (b: Benefit, cardIssuer: string): Benefit => {
  let name = getDisplayBenefitName(b.name);
  const lowercaseName = name.toLowerCase();

  // 1. Initial defaults
  let freq = (b.frequency as string) === 'calendar_year' ? 'annually' : b.frequency;
  let unit = b.unit || '$';
  let totalAmount = b.totalAmount;
  let resetIntervalMonths = b.resetIntervalMonths;
  let periodType = b.periodType || (freq === 'annually' || freq === 'anniversary' ? 'rolling' : 'calendar');

  // 2. Identify known benefits by name
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

export const normalizeCard = (card: CreditCard): CreditCard => {
  const template = card.templateId ? PREPOPULATED_CARDS.find(p => p.id === card.templateId) : undefined;

  let benefits = card.benefits;

  // Dynamically remove benefits that have been dropped from the template.
  // We only drop a benefit if:
  // 1. The card came from a template.
  // 2. The benefit is NOT marked as 'isCustom' (manually added by user).
  // 3. The benefit no longer exists in the current template.
  // 4. The benefit's name is a known standard template benefit name (to protect legacy custom benefits added before 'isCustom' existed).
  if (template) {
    // Include 'Bilt Cash' explicitly here so it gets cleaned up even though 
    // it's removed from the main BENEFIT_NAMES constant.
    const deprecatedNames = ['Bilt Cash'];
    const knownSystemNames = [...Object.values(BENEFIT_NAMES), ...deprecatedNames].map(n => n.toLowerCase());
    
    benefits = benefits.filter(b => {
      if (b.isCustom) return true; // Always keep user-added benefits
      
      const normalizedName = getDisplayBenefitName(b.name).toLowerCase();
      const existsInTemplate = template.benefits.some(
        tb => getDisplayBenefitName(tb.name).toLowerCase() === normalizedName
      );
      
      if (existsInTemplate) return true; // Still in template, keep it
      
      // Not in template. Is it a known system benefit?
      const isKnownSystemBenefit = knownSystemNames.some(kn => normalizedName.includes(kn) || kn.includes(normalizedName));
      
      // If it's a known system benefit but missing from the template, it was deprecated. Drop it.
      if (isKnownSystemBenefit) return false;
      
      // Otherwise, it must be a legacy custom benefit from before we added 'isCustom'. Keep it.
      return true;
    });
  }

  return {
    ...card,
    // Initialize with current date if not set, as no legacy data is being migrated.
    annualFeeDate: card.annualFeeDate || new Date().toISOString(),
    annualFeeAmount: template?.annualFeeAmount ?? card.annualFeeAmount ?? 0,
    isAnnualFeeDateSet: card.isAnnualFeeDateSet ?? true, // Default to true if new field is missing
    benefits: benefits.map(b => {
      let normalizedB = normalizeBenefit(b, card.issuer);

      // 5. Sync with template data if this card came from a template
      // This ensures that if we update the template (e.g., Hotel Credit goes from 200 to 300),
      // the user's existing cards get the updated values automatically.
      if (template) {
        const templateBenefit = template.benefits.find(
          tb => getDisplayBenefitName(tb.name).toLowerCase() === normalizedB.name.toLowerCase()
        );
        
        if (templateBenefit) {
          normalizedB = {
            ...normalizedB,
            totalAmount: templateBenefit.totalAmount,
            frequency: templateBenefit.frequency,
            periodType: templateBenefit.periodType,
            resetIntervalMonths: templateBenefit.resetIntervalMonths,
            unit: templateBenefit.unit,
            category: templateBenefit.category,
            // Fallback chain for legacy data recovery for expirationDate and isExpirationSet
            expirationDate: normalizedB.expirationDate || normalizedB.issueDate || (card as any).anniversaryDate || card.annualFeeDate,
            isExpirationSet: normalizedB.isExpirationSet ?? (card as any).isAnniversarySet ?? false
          };
        }
      }

      return normalizedB;
    })
  };
};
