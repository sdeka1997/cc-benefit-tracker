import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { PendingTransaction, CreditCard, Benefit } from '../types/index';

interface TransactionReviewQueueProps {
  pending: PendingTransaction[];
  cards: CreditCard[];
  onConfirm: (tx: PendingTransaction, cardId: string, benefitId: string, description: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toFixed(2);
  return amount < 0 ? `+$${abs}` : `$${abs}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TransactionCard({
  tx,
  cards,
  onConfirm,
  onDismiss,
}: {
  tx: PendingTransaction;
  cards: CreditCard[];
  onConfirm: (cardId: string, benefitId: string, description: string) => Promise<void>;
  onDismiss: () => Promise<void>;
}) {
  const [selectedCardId, setSelectedCardId] = useState(tx.suggestedCardId || '');
  const [selectedBenefitId, setSelectedBenefitId] = useState(tx.suggestedBenefitId || '');
  const [description, setDescription] = useState(tx.description);
  const [confirming, setConfirming] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const eligibleBenefits: Benefit[] = selectedCard
    ? selectedCard.benefits.filter(b => !b.unit || b.unit === '$')
    : [];

  const isCredit = tx.amount < 0;

  async function handleConfirm() {
    if (!selectedCardId || !selectedBenefitId) return;
    setConfirming(true);
    try {
      await onConfirm(selectedCardId, selectedBenefitId, description);
    } finally {
      setConfirming(false);
    }
  }

  async function handleDismiss() {
    setDismissing(true);
    try {
      await onDismiss();
    } finally {
      setDismissing(false);
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tx.description}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            {formatDate(tx.date)} · {tx.accountName}
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginLeft: '1rem', flexShrink: 0, color: isCredit ? 'var(--success)' : 'var(--text-main)' }}>
          {formatAmount(tx.amount)}
        </div>
      </div>

      {tx.suggestedBenefitName && (
        <div style={{ fontSize: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', color: '#1e40af' }}>
          Suggested: <strong>{tx.suggestedBenefitName}</strong> on {tx.suggestedCardName}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <select
          value={selectedCardId}
          onChange={e => { setSelectedCardId(e.target.value); setSelectedBenefitId(''); }}
          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontSize: '0.875rem', background: 'white' }}
        >
          <option value="">Select card…</option>
          {cards.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedBenefitId}
          onChange={e => setSelectedBenefitId(e.target.value)}
          disabled={!selectedCardId}
          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontSize: '0.875rem', background: 'white', opacity: selectedCardId ? 1 : 0.5 }}
        >
          <option value="">Select benefit…</option>
          {eligibleBenefits.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontSize: '0.875rem', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          <X size={15} />
          Skip
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedCardId || !selectedBenefitId || confirming}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.625rem', border: 'none', borderRadius: 'var(--radius)', background: selectedCardId && selectedBenefitId ? 'var(--primary)' : 'var(--border-color)', color: selectedCardId && selectedBenefitId ? 'white' : 'var(--text-muted)', cursor: selectedCardId && selectedBenefitId ? 'pointer' : 'default', fontSize: '0.875rem', fontWeight: 600 }}
        >
          <Check size={15} />
          {confirming ? 'Saving…' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}

export function TransactionReviewQueue({ pending, cards, onConfirm, onDismiss }: TransactionReviewQueueProps) {
  if (pending.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Review Queue
          <span style={{ marginLeft: '0.5rem', background: 'var(--primary)', color: 'white', borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.45rem', fontWeight: 700, verticalAlign: 'middle' }}>
            {pending.length}
          </span>
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          These transactions may match your benefits
        </span>
      </div>

      {pending.map(tx => (
        <TransactionCard
          key={tx.id}
          tx={tx}
          cards={cards}
          onConfirm={(cardId, benefitId, desc) => onConfirm(tx, cardId, benefitId, desc)}
          onDismiss={() => onDismiss(tx.id)}
        />
      ))}
    </div>
  );
}
