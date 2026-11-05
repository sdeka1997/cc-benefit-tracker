import { addMonths, endOfDay, parseISO, startOfDay } from 'date-fns';
import type { Benefit, CreditCard } from '../types/index';
import { DEFAULT_INTERVALS } from '../constants';
import { PREPOPULATED_CARDS } from '../data/prepopulatedCards';

/**
 * On a closed card, recurring perks stop. The only things that survive are
 * anniversary benefits that were already issued with an explicit expiry
 * (e.g. a companion certificate) — they last until the expiry of the period
 * that was current when the card was closed, and never roll forward.
 */
export const getClosedCardBenefitExpiry = (benefit: Benefit, closedDate: string): Date | null => {
  if (benefit.frequency !== 'anniversary' || !benefit.isExpirationSet || !benefit.expirationDate) {
    return null;
  }
  const closed = parseISO(closedDate);
  const interval = benefit.resetIntervalMonths || DEFAULT_INTERVALS.ANNUAL_ROLLING;
  let expiry = parseISO(benefit.expirationDate);
  while (endOfDay(expiry) < closed) {
    expiry = addMonths(expiry, interval);
  }
  return expiry;
};

/**
 * Whether a benefit belongs on the card's current template. Benefits a template
 * no longer lists are kept in storage (see normalizeCard) but not shown.
 */
const isBenefitInTemplate = (card: CreditCard, benefit: Benefit): boolean => {
  if (benefit.isCustom) return true;
  const template = PREPOPULATED_CARDS.find(p => p.id === card.templateId);
  if (!template) return true;
  return template.benefits.some(t => t.name === benefit.name);
};

/** Whether a benefit can still be used, given the card's template and open/closed status. */
export const isBenefitAvailable = (card: CreditCard, benefit: Benefit): boolean => {
  if (!isBenefitInTemplate(card, benefit)) return false;
  if (!card.closedDate) return true;
  const expiry = getClosedCardBenefitExpiry(benefit, card.closedDate);
  return expiry !== null && endOfDay(expiry) >= startOfDay(new Date());
};
