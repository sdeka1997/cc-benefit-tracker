import type { CreditCard, Benefit, BenefitDetection, PeriodType, ResetFrequency } from '../types/index';
import { BENEFIT_NAMES, DEFAULT_INTERVALS } from '../constants';

const createBenefit = (
  name: string,
  amount: number,
  frequency: ResetFrequency,
  category: string,
  periodType: PeriodType = 'calendar',
  intervalMonths?: number,
  unit: string = '$',
  issueDate?: string,
  detection?: BenefitDetection,
): Benefit => ({
  id: crypto.randomUUID(),
  name,
  totalAmount: amount,
  usedAmount: 0,
  frequency,
  periodType,
  category,
  usages: [],
  lastResetDate: new Date().toISOString(),
  resetIntervalMonths: intervalMonths,
  issueDate,
  unit,
  detection,
});

export const PREPOPULATED_CARDS: CreditCard[] = [
  {
    id: 'citi-strata-elite',
    name: 'Citi Strata Elite',
    issuer: 'Citi',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 0,
    benefits: [
      createBenefit(BENEFIT_NAMES.HOTEL_CREDIT, 300, 'annually', 'Lodging', 'calendar', undefined, '$', undefined,
        { type: 'statement_credit', amountRange: { min: 1, max: 300 } }),
      createBenefit(BENEFIT_NAMES.SPLURGE_CREDIT, 200, 'annually', 'Shopping', 'calendar', undefined, '$', undefined,
        { type: 'statement_credit', amountRange: { min: 1, max: 200 } }),
      createBenefit(BENEFIT_NAMES.BLACKLANE_CREDIT, 100, 'semi_annually', 'Travel Credit', 'calendar', undefined, '$', undefined,
        { type: 'merchant_match', merchantKeywords: ['blacklane'] }),
      createBenefit(BENEFIT_NAMES.ADMIRALS_CLUB_PASSES, 4, 'annually', 'Air Travel', 'calendar', undefined, 'passes', undefined,
        { type: 'manual' }),
      createBenefit(BENEFIT_NAMES.GLOBAL_ENTRY, 120, 'interval', 'Air Travel', 'rolling', DEFAULT_INTERVALS.GLOBAL_ENTRY, '$', undefined,
        { type: 'statement_credit', descriptionKeywords: ['global entry', 'tsa precheck', 'nexus', 'trusted traveler'], amountRange: { min: 78, max: 200 } }),
    ]
  },
  {
    id: 'chase-ink-unlimited',
    name: 'Chase Ink Business Unlimited',
    issuer: 'Chase',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 0,
    benefits: [
      createBenefit(BENEFIT_NAMES.INSTACART_CREDIT, 20, 'monthly', 'Dining', 'calendar', undefined, '$', undefined,
        { type: 'merchant_match', merchantKeywords: ['instacart'] }),
    ]
  },
  {
    id: 'chase-ink-preferred',
    name: 'Chase Ink Business Preferred',
    issuer: 'Chase',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 95,
    benefits: [
      createBenefit(BENEFIT_NAMES.DOORDASH_CREDIT, 10, 'monthly', 'Dining', 'calendar', undefined, '$', undefined,
        { type: 'merchant_match', merchantKeywords: ['doordash', 'dd *'] }),
    ]
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 0,
    benefits: [
      createBenefit(BENEFIT_NAMES.DOORDASH_CREDIT, 10, 'quarterly', 'Dining', 'calendar', undefined, '$', undefined,
        { type: 'merchant_match', merchantKeywords: ['doordash', 'dd *'] }),
    ]
  },
  {
    id: 'cap1-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 395,
    benefits: [
      createBenefit(BENEFIT_NAMES.TRAVEL_CREDIT, 300, 'anniversary', 'Travel Credit', 'rolling', DEFAULT_INTERVALS.ANNUAL_ROLLING, '$', undefined,
        { type: 'statement_credit', amountRange: { min: 1, max: 300 } }),
      createBenefit(BENEFIT_NAMES.GLOBAL_ENTRY, 120, 'interval', 'Air Travel', 'rolling', DEFAULT_INTERVALS.GLOBAL_ENTRY, '$', undefined,
        { type: 'statement_credit', descriptionKeywords: ['global entry', 'tsa precheck', 'nexus', 'trusted traveler'], amountRange: { min: 78, max: 200 } }),
    ]
  },
  {
    id: 'atmos-summit',
    name: 'Atmos Rewards Summit (Alaska Airlines)',
    issuer: 'Bank of America',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 95,
    benefits: [
      createBenefit(BENEFIT_NAMES.ALASKA_LOUNGE_PASSES, 2, 'quarterly', 'Air Travel', 'calendar', undefined, 'passes', undefined,
        { type: 'manual' }),
      createBenefit(BENEFIT_NAMES.ALASKA_WIFI_PASSES, 2, 'quarterly', 'Air Travel', 'calendar', undefined, 'passes', undefined,
        { type: 'manual' }),
      createBenefit(BENEFIT_NAMES.COMPANION_AWARD, 1, 'anniversary', 'Air Travel', 'rolling', DEFAULT_INTERVALS.COMPANION_AWARD, 'passes', undefined,
        { type: 'manual' }),
      createBenefit(BENEFIT_NAMES.GLOBAL_ENTRY, 120, 'interval', 'Air Travel', 'rolling', DEFAULT_INTERVALS.GLOBAL_ENTRY, '$', undefined,
        { type: 'statement_credit', descriptionKeywords: ['global entry', 'tsa precheck', 'nexus', 'trusted traveler'], amountRange: { min: 78, max: 200 } }),
    ]
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 95,
    benefits: [
      createBenefit(BENEFIT_NAMES.HOTEL_CREDIT, 50, 'anniversary', 'Lodging', 'rolling', 12, '$', undefined,
        { type: 'statement_credit', amountRange: { min: 1, max: 50 } }),
      createBenefit(BENEFIT_NAMES.DOORDASH_CREDIT, 10, 'monthly', 'Dining', 'calendar', undefined, '$', undefined,
        { type: 'merchant_match', merchantKeywords: ['doordash', 'dd *'] }),
    ]
  },
  {
    id: 'bilt-palladium',
    name: 'Bilt Palladium',
    issuer: 'Cardless',
    annualFeeDate: new Date().toISOString(),
    annualFeeAmount: 0,
    benefits: [
      createBenefit(BENEFIT_NAMES.HOTEL_CREDIT, 200, 'semi_annually', 'Lodging', 'calendar', undefined, '$', undefined,
        { type: 'statement_credit', amountRange: { min: 1, max: 200 } }),
    ]
  }
];
