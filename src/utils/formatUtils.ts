import { format } from 'date-fns';

/**
 * Formats a number as USD currency.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Formats a benefit value based on its unit.
 */
export const formatBenefitValue = (amount: number, unit?: string): string => {
  if (!unit || unit === '$') {
    return formatCurrency(amount);
  }
  return `${amount} ${unit}`;
};

/**
 * Formats a date string or object to a local date string.
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

/**
 * Formats a date string or object to a short readable string (e.g., Jan 1, 2024).
 */
export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
};

/**
 * Returns a user-friendly label for a reset frequency.
 */
export const getFrequencyLabel = (frequency: string): string => {
  const labels: Record<string, string> = {
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'semi_annually': 'Semi-Annual',
    'annually': 'Annual',
    'anniversary': 'Anniversary',
    'interval': 'Interval'
  };
  
  // Handle some alternate names that might exist in data
  const normalizedFreq = frequency.toLowerCase().replace(' ', '_');
  return labels[normalizedFreq] || frequency.replace('_', ' ');
};
