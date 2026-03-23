export type ResetFrequency = 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'anniversary' | 'interval';
export type PeriodType = 'calendar' | 'rolling';

export interface BenefitUsage {
  id: string;
  amount: number;
  date: string;
  description: string;
}

export interface Benefit {
  id: string;
  name: string;
  totalAmount: number;
  usedAmount: number;
  frequency: ResetFrequency;
  periodType: PeriodType;
  category: string;
  usages: BenefitUsage[];
  lastResetDate: string;
  resetIntervalMonths?: number;
  issueDate?: string; // For anniversary benefits
  unit?: string; // '$' (default), 'passes', 'miles', etc.
  isHidden?: boolean; // Whether the benefit is hidden from the UI tabs
  isCustom?: boolean; // Whether the benefit was manually added by the user
}

export interface CreditCard {
  id: string;
  templateId?: string; // Links back to prepopulated template
  name: string;
  issuer: string;
  benefits: Benefit[];
  anniversaryDate: string;
  isAnniversarySet?: boolean; // Track if user has explicitly set this
}

export interface UserSettings {
  showGlobalExpiryDate: boolean;
}

export interface UserData {
  cards: CreditCard[];
  settings: UserSettings;
  lastUpdated: string;
}
