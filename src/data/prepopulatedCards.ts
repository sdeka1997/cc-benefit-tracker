import type { CreditCard, Benefit, PeriodType, ResetFrequency } from '../types/index';
import { BENEFIT_NAMES, DEFAULT_INTERVALS } from '../constants';

const createBenefit = (
  name: string, 
  amount: number, 
  frequency: ResetFrequency, 
  category: string, 
  periodType: PeriodType = 'calendar',
  intervalMonths?: number,
  unit: string = '$',
  issueDate?: string
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
});

export const PREPOPULATED_CARDS: CreditCard[] = [
  {
    id: 'citi-strata-elite',
    name: 'Citi Strata Elite',
    issuer: 'Citi',
    anniversaryDate: new Date().toISOString(),
    benefits: [
      createBenefit('Hotel Credit', 300, 'annually', 'Travel', 'calendar'),
      createBenefit('Splurge Credit', 200, 'annually', 'Shopping', 'calendar'),
      createBenefit('Blacklane Credit', 100, 'semi_annually', 'Travel', 'calendar'),
      createBenefit('4 Admirals Club Passes', 4, 'annually', 'Travel', 'calendar', undefined, 'passes'),
      createBenefit(BENEFIT_NAMES.GLOBAL_ENTRY, 120, 'interval', 'Travel', 'rolling', DEFAULT_INTERVALS.GLOBAL_ENTRY),
    ]
  },
  {
    id: 'chase-ink-unlimited',
    name: 'Chase Ink Business Unlimited',
    issuer: 'Chase',
    anniversaryDate: new Date().toISOString(),
    benefits: [
      createBenefit('Instacart Credit', 20, 'monthly', 'Dining', 'calendar'),
      createBenefit('DoorDash Credit', 10, 'quarterly', 'Dining', 'calendar'),
    ]
  },
  {
    id: 'chase-ink-preferred',
    name: 'Chase Ink Business Preferred',
    issuer: 'Chase',
    anniversaryDate: new Date().toISOString(),
    benefits: [
      createBenefit('DoorDash Credit', 10, 'monthly', 'Dining', 'calendar'),
    ]
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    anniversaryDate: new Date().toISOString(),
    benefits: [
      createBenefit('DoorDash Credit', 10, 'quarterly', 'Dining', 'calendar'),
      createBenefit('Instacart Credit', 10, 'quarterly', 'Dining', 'calendar'),
    ]
  },
  {
    id: 'cap1-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    anniversaryDate: new Date().toISOString(),
    benefits: [
      createBenefit(BENEFIT_NAMES.TRAVEL_CREDIT, 300, 'anniversary', 'Travel', 'rolling', DEFAULT_INTERVALS.ANNUAL_ROLLING),
      createBenefit(BENEFIT_NAMES.GLOBAL_ENTRY, 120, 'interval', 'Travel', 'rolling', DEFAULT_INTERVALS.GLOBAL_ENTRY),
    ]
  },
  {
    id: 'atmos-summit',
    name: 'Atmos Rewards Summit (Alaska Airlines)',
    issuer: 'Bank of America',
    anniversaryDate: new Date().toISOString(),
    benefits: [
      createBenefit('Alaska Lounge Passes', 2, 'quarterly', 'Travel', 'calendar', undefined, 'passes'),
      createBenefit('Alaska Inflight Wi-Fi Passes', 2, 'quarterly', 'Travel', 'calendar', undefined, 'passes'),
      createBenefit(BENEFIT_NAMES.COMPANION_AWARD, 1, 'anniversary', 'Travel', 'rolling', DEFAULT_INTERVALS.COMPANION_AWARD, 'passes'),
      createBenefit(BENEFIT_NAMES.GLOBAL_ENTRY, 120, 'interval', 'Travel', 'rolling', DEFAULT_INTERVALS.GLOBAL_ENTRY),
    ]
  }
];
