import { TellerSync } from './TellerSync';
import { TransactionReviewQueue } from './TransactionReviewQueue';
import { matchTransactions } from '../utils/transactionMatcher';
import { usePendingTransactions } from '../hooks/usePendingTransactions';
import type { CreditCard, PendingTransaction } from '../types/index';
import type { RawTransaction } from '../utils/transactionMatcher';

interface SyncTabProps {
  uid: string;
  cards: CreditCard[];
  onAddUsage: (cardId: string, benefitId: string, amount: number, description: string, date: string) => void;
}

export function SyncTab({ uid, cards, onAddUsage }: SyncTabProps) {
  const { pending, existingTellerIds, addPendingBatch, dismissPending } = usePendingTransactions(uid);

  async function handleTransactionsFetched(rawTransactions: unknown[]) {
    const matched = matchTransactions(
      rawTransactions as RawTransaction[],
      cards,
      existingTellerIds,
    );
    if (matched.length > 0) {
      await addPendingBatch(matched);
    }
  }

  async function handleConfirm(tx: PendingTransaction, cardId: string, benefitId: string, description: string) {
    const amount = Math.abs(tx.amount);
    onAddUsage(cardId, benefitId, amount, description, tx.date);
    await dismissPending(tx.id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TellerSync uid={uid} onTransactionsFetched={handleTransactionsFetched} />
      <TransactionReviewQueue
        pending={pending}
        cards={cards}
        onConfirm={handleConfirm}
        onDismiss={dismissPending}
      />
      {pending.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          No transactions pending review. Sync your cards above to get started.
        </p>
      )}
    </div>
  );
}
