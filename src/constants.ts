import type { ResetFrequency, PeriodType } from './types/index';

export const STATUS_COLORS = {
  DANGER: 'var(--danger)',
  WARNING: 'var(--warning)',
  SUCCESS: 'var(--success)',
  MUTED: 'var(--text-muted)',
};

export const KPI_COLORS = {
  NEXT_EXPIRY: 'var(--success)', // Default
  AVAILABLE_TODAY: '#06b6d4', // Cyan
  LIFETIME_SAVINGS: '#d946ef', // Fuchsia
};

export const BENEFIT_NAMES = {
  COMPANION_AWARD: '25K Companion Award',
  GLOBAL_ENTRY: 'Global Entry / TSA PreCheck',
  TRAVEL_CREDIT: 'Travel Credit',
  HOTEL_CREDIT: 'Hotel Credit',
  DOORDASH_CREDIT: 'DoorDash Credit',
  INSTACART_CREDIT: 'Instacart Credit',
  SPLURGE_CREDIT: 'Splurge Credit',
  BLACKLANE_CREDIT: 'Blacklane Credit',
  ADMIRALS_CLUB_PASSES: '4 Admirals Club Passes',
  ALASKA_LOUNGE_PASSES: 'Alaska Lounge Passes',
  ALASKA_WIFI_PASSES: 'Alaska Inflight Wi-Fi Passes',
} as const;

export interface BenefitConfiguration {
  defaultAmount?: number;
  frequency?: ResetFrequency;
  periodType?: PeriodType;
  unit?: string;
  resetIntervalMonths?: number;
  displayMode?: 'remaining' | 'spent';
  hideTotalInSubheader?: boolean;
}

export const BENEFIT_CONFIGS: Record<string, BenefitConfiguration> = {
  [BENEFIT_NAMES.GLOBAL_ENTRY]: {
    defaultAmount: 120,
    frequency: 'interval',
    periodType: 'rolling',
    resetIntervalMonths: 48,
    unit: '$'
  },
  [BENEFIT_NAMES.COMPANION_AWARD]: {
    defaultAmount: 1,
    frequency: 'anniversary',
    periodType: 'rolling',
    resetIntervalMonths: 12,
    unit: 'passes'
  },
  [BENEFIT_NAMES.TRAVEL_CREDIT]: {
    frequency: 'anniversary',
    periodType: 'rolling',
    resetIntervalMonths: 12,
    unit: '$'
  },
  [BENEFIT_NAMES.HOTEL_CREDIT]: {
    unit: '$'
  }
};

export const DEFAULT_INTERVALS = {
  GLOBAL_ENTRY: 48,
  COMPANION_AWARD: 12,
  ANNUAL_ROLLING: 12,
};

export const TABS = {
  EXPIRING: 'expiring',
  CATEGORY: 'category',
  CARDS: 'cards',
  PROFILE: 'profile',
} as const;

export type TabType = typeof TABS[keyof typeof TABS];

export const EXPIRY_GROUPS = {
  SOON: 'Expiring within 7 days',
  MONTH: 'Expiring within 30 days',
  QUARTER: 'Expiring within 90 days',
  LATER: 'Later',
  FULLY_USED: 'Fully Used',
} as const;

export const EXPIRY_ORDER = [
  EXPIRY_GROUPS.SOON,
  EXPIRY_GROUPS.MONTH,
  EXPIRY_GROUPS.QUARTER,
  EXPIRY_GROUPS.LATER,
  EXPIRY_GROUPS.FULLY_USED,
];

export interface ResetTypeOption {
  id: string;
  label: string;
  frequency: ResetFrequency;
  periodType: PeriodType;
  hasInterval?: boolean;
}

export const RESET_TYPES: ResetTypeOption[] = [
  { id: 'calendar_monthly', label: 'Monthly', frequency: 'monthly', periodType: 'calendar' },
  { id: 'calendar_quarterly', label: 'Quarterly', frequency: 'quarterly', periodType: 'calendar' },
  { id: 'calendar_semi_annually', label: 'Semi-Annual', frequency: 'semi_annually', periodType: 'calendar' },
  { id: 'calendar_annually', label: 'Annual', frequency: 'annually', periodType: 'calendar' },
  { id: 'rolling_anniversary', label: 'Anniversary', frequency: 'anniversary', periodType: 'rolling' },
  { id: 'rolling_interval', label: 'Interval', frequency: 'interval', periodType: 'rolling', hasInterval: true },
];
