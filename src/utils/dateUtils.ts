import { 
  endOfYear, 
  differenceInDays, 
  isAfter,
  addYears,
  addMonths,
  setYear,
  isBefore,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subYears,
  addQuarters,
  subDays,
  startOfDay,
  endOfDay
} from 'date-fns';
import type { Benefit } from '../types/index';
import { STATUS_COLORS, DEFAULT_INTERVALS } from '../constants';

export { parseISO, isAfter };

export const getPeriodStartDate = (benefit: Benefit, cardAnnualFeeDateStr?: string): Date => {
  const now = new Date();
  const frequency = benefit.frequency.toLowerCase();

  if (frequency === 'anniversary') {
    let baseDate: Date;
    // Prioritize benefit-specific expiration date if set
    if (benefit.expirationDate && benefit.expirationDate !== '') {
      const parsed = parseISO(benefit.expirationDate);
      baseDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
    } else if (cardAnnualFeeDateStr && cardAnnualFeeDateStr !== '') {
      // Fallback to card's annual fee date if benefit specific expiration is not set
      const parsed = parseISO(cardAnnualFeeDateStr);
      baseDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
    } else {
      baseDate = now;
    }
    
    let date = setYear(baseDate, now.getFullYear());
    if (isAfter(date, now)) date = subYears(date, 1);
    
    // If it's multi-year anniversary, we need to find the specific start of the current multi-year period
    const intervalMonths = benefit.resetIntervalMonths || DEFAULT_INTERVALS.ANNUAL_ROLLING;
    if (intervalMonths > 12) {
      // Find how many intervals since baseDate
      let checkDate = baseDate;
      while (isBefore(addMonths(checkDate, intervalMonths), now) || addMonths(checkDate, intervalMonths).getTime() === now.getTime()) {
        checkDate = addMonths(checkDate, intervalMonths);
      }
      return checkDate;
    }
    return date;
  }

  if (frequency === 'interval') {
    if (benefit.usages.length > 0) {
      const lastUsage = benefit.usages.reduce((prev, curr) => 
        isAfter(parseISO(curr.date), parseISO(prev.date)) ? curr : prev
      );
      return parseISO(lastUsage.date);
    }
    return new Date(0);
  }

  // Calendar logic (default)
  switch (frequency) {
    case 'monthly':
      return startOfMonth(now);
    case 'quarterly':
      return startOfQuarter(now);
    case 'semi annually':
    case 'semi_annually':
      const midYear = new Date(now.getFullYear(), 6, 1); // July 1st
      return isAfter(now, midYear) ? midYear : startOfYear(now);
    case 'annually':
      return startOfYear(now);
    default:
      return startOfYear(now);
  }
};

export const calculateCurrentUsedAmount = (benefit: Benefit, cardAnnualFeeDateStr?: string): number => {
  const periodStart = getPeriodStartDate(benefit, cardAnnualFeeDateStr);
  const currentPeriodUsages = benefit.usages.filter(u => {
    const usageDate = parseISO(u.date);
    return isAfter(usageDate, periodStart) || usageDate.getTime() === periodStart.getTime();
  });
  return currentPeriodUsages.reduce((sum, u) => sum + u.amount, 0);
};

export const getPeriodEndDate = (benefit: Benefit, cardAnnualFeeDateStr?: string): Date => {
  const startDate = getPeriodStartDate(benefit, cardAnnualFeeDateStr);
  const frequency = benefit.frequency.toLowerCase();
  const now = new Date();
  
  switch (frequency) {
    case 'monthly':
      return subDays(addMonths(startDate, 1), 1);
    case 'quarterly':
      return subDays(addQuarters(startDate, 1), 1);
    case 'semi_annually':
    case 'semi annually':
      return subDays(addMonths(startDate, 6), 1);
    case 'annually':
      return subDays(addYears(startDate, 1), 1);
    case 'anniversary':
      const interval = benefit.resetIntervalMonths || DEFAULT_INTERVALS.ANNUAL_ROLLING;
      return subDays(addMonths(startDate, interval), 1);
    case 'interval':
      if (benefit.usages.length > 0 && benefit.resetIntervalMonths) {
        const lastUsage = benefit.usages.reduce((prev, curr) => 
          isAfter(parseISO(curr.date), parseISO(prev.date)) ? curr : prev
        );
        return subDays(addMonths(parseISO(lastUsage.date), benefit.resetIntervalMonths), 1);
      } else if (benefit.resetIntervalMonths) {
          return addYears(now, 10);
      }
      return addYears(now, 4);
    default:
      return endOfYear(now);
  }
};

export const getDaysRemaining = (benefit: Benefit, cardAnnualFeeDateStr?: string): number => {
  const now = new Date();
  const end = getPeriodEndDate(benefit, cardAnnualFeeDateStr);
  // Compare the end of the expiration day with the start of today.
  // This ensures that if today is the expiration day, the user has until 11:59:59 PM to use it.
  return Math.max(0, differenceInDays(endOfDay(end), startOfDay(now)));
};

export const getStatusColor = (days: number, isFullyUsed?: boolean): string => {
  if (isFullyUsed) return STATUS_COLORS.DANGER;
  if (days <= 7) return STATUS_COLORS.DANGER;
  if (days <= 14) return STATUS_COLORS.WARNING;
  return STATUS_COLORS.SUCCESS;
};
