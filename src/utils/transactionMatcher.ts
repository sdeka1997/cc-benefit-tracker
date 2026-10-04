import type { CreditCard, Benefit, PendingTransaction } from '../types/index';

export interface RawTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  type: string | null;
  accountId: string;
  accountName: string;
  institutionName: string;
}

interface BenefitMatch {
  cardId: string;
  cardName: string;
  benefitId: string;
  benefitName: string;
}

function shouldSkip(tx: RawTransaction, existingIds: Set<string>): boolean {
  if (existingIds.has(tx.id)) return true;
  if (tx.status === 'pending') return true;
  if (tx.type === 'payment') return true;
  if (/electronic payment|online\/mobile payment/i.test(tx.description)) return true;
  return false;
}

function findMatch(tx: RawTransaction, benefit: Benefit): boolean {
  const { detection } = benefit;
  if (!detection || detection.type === 'manual') return false;

  const absAmount = Math.abs(tx.amount);
  if (detection.amountRange) {
    const { min, max } = detection.amountRange;
    if (min !== undefined && absAmount < min) return false;
    if (max !== undefined && absAmount > max) return false;
  }

  if (detection.type === 'statement_credit') {
    if (tx.amount >= 0) return false;
    if (detection.descriptionKeywords && detection.descriptionKeywords.length > 0) {
      const desc = tx.description.toLowerCase();
      if (!detection.descriptionKeywords.some(kw => desc.includes(kw.toLowerCase()))) return false;
    }
    return true;
  }

  if (detection.type === 'merchant_match') {
    if (tx.amount <= 0) return false;
    if (!detection.merchantKeywords || detection.merchantKeywords.length === 0) return false;
    const desc = tx.description.toLowerCase();
    return detection.merchantKeywords.some(kw => desc.includes(kw.toLowerCase()));
  }

  return false;
}

// Prefer the card whose name shares the most words with the Teller account name.
// Falls back to scanning all cards if no confident match is found.
function findCardForAccount(accountName: string, cards: CreditCard[]): CreditCard | undefined {
  const accountWords = accountName.toLowerCase().split(/\s+/);
  let best: CreditCard | undefined;
  let bestScore = 0;

  for (const card of cards) {
    const cardWords = card.name.toLowerCase().split(/\s+/);
    const score = accountWords.filter(w => w.length > 2 && cardWords.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }

  return bestScore > 0 ? best : undefined;
}

export function matchTransactions(
  transactions: RawTransaction[],
  cards: CreditCard[],
  existingIds: Set<string>,
): PendingTransaction[] {
  const results: PendingTransaction[] = [];
  const seenTxIds = new Set<string>();

  for (const tx of transactions) {
    if (shouldSkip(tx, existingIds) || seenTxIds.has(tx.id)) continue;

    // Prefer checking only the matched card's benefits; fall back to all cards
    const matchedCard = findCardForAccount(tx.accountName, cards);
    const searchScope: CreditCard[] = matchedCard ? [matchedCard] : cards;

    let suggestion: BenefitMatch | undefined;
    outer: for (const card of searchScope) {
      for (const benefit of card.benefits) {
        if (findMatch(tx, benefit)) {
          suggestion = {
            cardId: card.id,
            cardName: card.name,
            benefitId: benefit.id,
            benefitName: benefit.name,
          };
          break outer;
        }
      }
    }

    // Only surface transactions that matched at least one benefit
    if (!suggestion) continue;

    seenTxIds.add(tx.id);
    results.push({
      id: '',
      tellerTxId: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      status: tx.status,
      type: tx.type,
      accountId: tx.accountId,
      accountName: tx.accountName,
      institutionName: tx.institutionName,
      suggestedCardId: suggestion.cardId,
      suggestedCardName: suggestion.cardName,
      suggestedBenefitId: suggestion.benefitId,
      suggestedBenefitName: suggestion.benefitName,
    });
  }

  return results;
}
