import React from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { BenefitItem } from './BenefitItem';
import { getStatusColor } from '../utils/dateUtils';
import { calculateBenefitMetrics } from '../utils/benefitMetrics';
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
  onDeleteUsage
}) => {
  const [_, name] = groupKey.includes('|') ? groupKey.split('|') : [null, groupKey];
  const groupName = name || groupKey;

  let groupRemaining = 0;
  benefits.forEach(b => {
    const { remaining } = calculateBenefitMetrics(b, b.anniversaryDate);
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
          {benefits.map(b => {
            const { daysLeft, isFullyUsed, expiryDate } = calculateBenefitMetrics(b, b.anniversaryDate);
            const hasHeader = !hideCardLabel || isByExpiry;
            const needsInfo = b.frequency === 'anniversary' && !b.issueDate;
            
            return (
              <div key={b.id} className="card" style={{ padding: '1rem', opacity: isFullyUsed ? 0.7 : 1 }}>
                {hasHeader && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {!hideCardLabel ? b.cardName : ''}
                    </div>
                    {isByExpiry && !needsInfo && (
                      <span 
                        className="badge" 
                        style={{ 
                          color: isFullyUsed ? 'var(--text-muted)' : getStatusColor(daysLeft), 
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
                        {b.frequency === 'interval' 
                          ? (isFullyUsed 
                              ? `Available on ${expiryDate.toLocaleDateString()}` 
                              : 'Available now')
                          : (showGlobalExpiryDate || isFullyUsed) 
                            ? (isFullyUsed 
                                ? `Resets ${expiryDate.toLocaleDateString()}`
                                : expiryDate.toLocaleDateString())
                            : `${daysLeft}d left`
                        }
                      </span>
                    )}
                  </div>
                )}
                <BenefitItem 
                  benefit={b} 
                  anniversaryDate={b.anniversaryDate}
                  hideBorder={!hasHeader}
                  hideAddButton={isFullyUsed}
                  onAddUsage={(bId, amt, desc, date) => onAddUsage(b.cardId, bId, amt, desc, date)}
                  onDeleteUsage={(bId, uId) => onDeleteUsage(b.cardId, bId, uId)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
