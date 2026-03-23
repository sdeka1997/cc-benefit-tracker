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

export const DEFAULT_INTERVALS = {
  GLOBAL_ENTRY: 48,
  COMPANION_AWARD: 12,
  ANNUAL_ROLLING: 12,
};

export const BENEFIT_NAMES = {
  COMPANION_AWARD: '25K Companion Award',
  GLOBAL_ENTRY: 'Global Entry / TSA PreCheck',
  TRAVEL_CREDIT: 'Travel Credit',
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
  { id: 'calendar_monthly', label: 'Monthly (Calendar)', frequency: 'monthly', periodType: 'calendar' },
  { id: 'calendar_quarterly', label: 'Quarterly (Calendar)', frequency: 'quarterly', periodType: 'calendar' },
  { id: 'calendar_semi_annually', label: 'Semi-Annual (Calendar)', frequency: 'semi_annually', periodType: 'calendar' },
  { id: 'calendar_annually', label: 'Annual (Calendar Year)', frequency: 'annually', periodType: 'calendar' },
  { id: 'rolling_annually', label: 'Annual (Anniversary)', frequency: 'annually', periodType: 'rolling' },
  { id: 'rolling_anniversary', label: 'Anniversary', frequency: 'anniversary', periodType: 'rolling' },
  { id: 'rolling_interval', label: 'Interval', frequency: 'interval', periodType: 'rolling', hasInterval: true },
];
