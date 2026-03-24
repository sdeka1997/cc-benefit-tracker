import React from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { addDays } from 'date-fns';
import { BenefitItem } from './BenefitItem';
import { getStatusColor } from '../utils/dateUtils';
import { calculateBenefitMetrics, needsAnniversaryDate } from '../utils/benefitMetrics';
import type { Benefit } from '../types/index';
import type { GroupedBenefits } from '../utils/groupingUtils';

interface BenefitGroupProps {
  groupKey: string;
  benefits: GroupedBenefits[string];
  isCollapsed: boolean;
  onToggle: () => void;
  isByExpiry: boolean;
  showGlobalExpiryDate: boolean;
  onToggleExpiry: () => void;
  hideCardLabel: boolean;
  onAddUsage: (cardId: string, bId: string, amt: number, desc: string, date: string) => void;
  onDeleteUsage: (cardId: string, bId: string, uId: string) => void;
  onUpdateBenefit: (cardId: string, bId: string, updates: Partial<Benefit>) => void;
}

export const BenefitGroup: React.FC<BenefitGroupProps> = ({
  groupKey,
  benefits,
  isCollapsed,
  onToggle,
  isByExpiry,
  showGlobalExpiryDate,
  onToggleExpiry,
  hideCardLabel,
  onAddUsage,
  onDeleteUsage,
  onUpdateBenefit
}) => {
  const [_, name] = groupKey.includes('|') ? groupKey.split('|') : [null, groupKey];
  const groupName = name || groupKey;

  let groupRemaining = 0;
  benefits.forEach(b => {
    const { remaining } = calculateBenefitMetrics(b, b.annualFeeDate);
    const isMonetary = !b.unit || b.unit === '$';
    if (isMonetary) {
      groupRemaining += remaining;
    }
  });

  const getHeaderStatusColor = () => {
    return 'var(--status-green)'; 
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="group-header" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={onToggle}>
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{groupName}</span>
          {groupName !== 'Fully Used' && (
            <span className="badge" style={{ backgroundColor: getHeaderStatusColor(), color: 'var(--text-main)', border: 'none', fontWeight: 'bold' }}>
              ${groupRemaining.toFixed(2)} remaining
            </span>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="card-grid">
          {groupName === 'Travel' ? (
            // Nested grouping for Travel
            ['Air Travel', 'Lodging', 'Travel Credit'].map(subCat => {
              const subBenefits = benefits.filter(b => b.category === subCat);
              if (subBenefits.length === 0) return null;
              
              return (
                <React.Fragment key={subCat}>
                  <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subCat}</h5>
                  </div>
                  {subBenefits.map(b => (
                    <BenefitCard 
                      key={b.id} 
                      b={b} 
                      hideCardLabel={hideCardLabel} 
                      isByExpiry={isByExpiry} 
                      showGlobalExpiryDate={showGlobalExpiryDate} 
                      onToggleExpiry={onToggleExpiry}
                      onAddUsage={onAddUsage}
                      onDeleteUsage={onDeleteUsage}
                      onUpdateBenefit={onUpdateBenefit}
                    />
                  ))}
                </React.Fragment>
              );
            })
          ) : (
            // Standard flat grouping for others
            benefits.map(b => (
              <BenefitCard 
                key={b.id} 
                b={b} 
                hideCardLabel={hideCardLabel} 
                isByExpiry={isByExpiry} 
                showGlobalExpiryDate={showGlobalExpiryDate} 
                onToggleExpiry={onToggleExpiry}
                onAddUsage={onAddUsage}
                onDeleteUsage={onDeleteUsage}
                onUpdateBenefit={onUpdateBenefit}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface BenefitCardProps {
  b: any;
  hideCardLabel: boolean;
  isByExpiry: boolean;
  showGlobalExpiryDate: boolean;
  onToggleExpiry: () => void;
  onAddUsage: any;
  onDeleteUsage: any;
  onUpdateBenefit: any;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  b,
  hideCardLabel,
  isByExpiry,
  showGlobalExpiryDate,
  onToggleExpiry,
  onAddUsage,
  onDeleteUsage,
  onUpdateBenefit
}) => {
  const { daysLeft, isFullyUsed, expiryDate } = calculateBenefitMetrics(b, b.annualFeeDate);
  const hasHeader = !hideCardLabel || isByExpiry;
  const needsInfo = needsAnniversaryDate(b) && !b.isExpirationSet;
  const resetDate = addDays(expiryDate, 1);

  return (
    <div className="card" style={{ 
      padding: '1rem', 
      opacity: isFullyUsed ? 0.7 : 1,
      backgroundColor: needsInfo ? 'rgba(245, 158, 11, 0.05)' : 'white',
      border: needsInfo ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
      boxShadow: needsInfo ? '0 0 10px rgba(245, 158, 11, 0.1)' : 'none'
    }}>
      {hasHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {!hideCardLabel ? b.cardName : ''}
          </div>
          {!needsInfo && (
            <span 
              className="badge" 
              style={{ 
                color: isFullyUsed ? 'var(--text-muted)' : getStatusColor(daysLeft, isFullyUsed), 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '0.65rem',
                cursor: (isFullyUsed || b.frequency === 'interval') ? 'default' : 'pointer',
                userSelect: 'none',
                opacity: isFullyUsed ? 0.8 : 1
              }}
              onClick={(isFullyUsed || b.frequency === 'interval') ? undefined : onToggleExpiry}
            >
              <Clock size={10} />
              {isFullyUsed 
                ? `Available on ${resetDate.toLocaleDateString()}`
                : b.frequency === 'interval'
                  ? 'Available now'
                  : (showGlobalExpiryDate)
                    ? expiryDate.toLocaleDateString()
                    : `${daysLeft}d left`
              }
            </span>
          )}
        </div>
      )}
      <BenefitItem 
        benefit={b} 
        annualFeeDate={b.annualFeeDate}
        hideBorder={!hasHeader}
        hideAddButton={isFullyUsed}
        onAddUsage={(bId, amt, desc, date) => onAddUsage(b.cardId, bId, amt, desc, date)}
        onDeleteUsage={(bId, uId) => onDeleteUsage(b.cardId, bId, uId)}
        onUpdateBenefit={(bId, updates) => onUpdateBenefit(b.cardId, bId, updates)}
      />
    </div>
  );
};
