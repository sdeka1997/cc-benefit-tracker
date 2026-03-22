import React from 'react';
import { KPI_COLORS } from '../constants';
import { getStatusColor } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatUtils';

interface HeaderStatsProps {
  lifetimeSavings: number;
  availableToday: number;
  nextExpiryDays: number | null;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({ 
  lifetimeSavings, 
  availableToday, 
  nextExpiryDays 
}) => {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Next Expiry</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: nextExpiryDays !== null ? getStatusColor(nextExpiryDays) : KPI_COLORS.NEXT_EXPIRY }}>
          {nextExpiryDays !== null ? `${nextExpiryDays} days` : 'N/A'}
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Available Today</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: KPI_COLORS.AVAILABLE_TODAY }}>{formatCurrency(availableToday)}</div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Lifetime Savings</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: KPI_COLORS.LIFETIME_SAVINGS }}>{formatCurrency(lifetimeSavings)}</div>
      </div>
    </section>
  );
};
