import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, History, Plus, X as CloseIcon, Check } from 'lucide-react';
import type { Benefit } from '../types/index';
import { calculateCurrentUsedAmount } from '../utils/dateUtils';
import { getDisplayBenefitName } from '../utils/stringUtils';

interface BenefitItemProps {
  benefit: Benefit;
  onAddUsage: (benefitId: string, amount: number, description: string, date: string) => void;
  onDeleteUsage: (benefitId: string, usageId: string) => void;
  anniversaryDate?: string;
  hideBorder?: boolean;
  hideAddButton?: boolean;
}

export const BenefitItem: React.FC<BenefitItemProps> = ({ benefit, onAddUsage, onDeleteUsage, anniversaryDate, hideBorder, hideAddButton }) => {
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [usageDate, setUsageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate current period metrics
  const currentUsedAmount = calculateCurrentUsedAmount(benefit, anniversaryDate);
  const remaining = benefit.totalAmount - currentUsedAmount;
  const remainingPercent = (remaining / benefit.totalAmount) * 100;
  const percent = Math.min(100, (currentUsedAmount / benefit.totalAmount) * 100);

  const isMonetary = !benefit.unit || benefit.unit === '$';
  
  const formatValue = (val: number) => {
    if (isMonetary) return `$${val.toFixed(2)}`;
    return `${val} ${benefit.unit}`;
  };

  const displayName = getDisplayBenefitName(benefit.name);

  const getStatusColor = () => {
    if (remainingPercent < 10) return 'var(--status-red)';
    if (remainingPercent < 40) return 'var(--status-yellow)';
    return 'var(--status-green)';
  };

  const handleAdd = () => {
    const amount = parseFloat(quickAmount);
    if (!isNaN(amount) && amount > 0) {
      onAddUsage(benefit.id, amount, description || 'Manual entry', new Date(usageDate).toISOString());
      setQuickAmount('');
      setDescription('');
      setUsageDate(new Date().toISOString().split('T')[0]);
      setShowAddForm(false);
    }
  };

  const getFrequencyDisplay = () => {
    return benefit.frequency.replace('_', ' ');
  };

  const subHeaderParts = [
    formatValue(benefit.totalAmount),
    getFrequencyDisplay(),
    benefit.category?.toLowerCase()
  ].filter(Boolean);

  return (
    <div className="benefit-item" style={hideBorder ? { borderTop: 'none', marginTop: 0, paddingTop: 0 } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0 }}>{displayName}</h4>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>{subHeaderParts.join(' • ')}</span>
          </div>
        </div>
      </div>

      <div className="progress-container" style={{ marginTop: '12px' }}>
        <div 
          className="progress-bar" 
          style={{ 
            width: `${percent}%`, 
            background: getStatusColor()
          }} 
        />
      </div>

      {!hideAddButton && showAddForm && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', padding: '8px', background: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
          <input 
            type="date"
            value={usageDate}
            onChange={(e) => setUsageDate(e.target.value)}
            style={{ width: '110px', padding: '4px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            autoFocus
          />
          <input 
            type="number" 
            placeholder={isMonetary ? "$" : "#"} 
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
            style={{ width: '60px', padding: '4px 6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          />
          <input 
            placeholder="Note" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ flex: 1, padding: '4px 6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          />
          <button 
            onClick={handleAdd} 
            style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            title="Confirm"
          >
            <Check size={16} />
          </button>
          <button 
            onClick={() => setShowAddForm(false)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            title="Cancel"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              fontSize: '0.75rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0
            }}
          >
            <History size={14} />
            {benefit.usages.length} entries {showHistory ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
          
          {!hideAddButton && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: showAddForm ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '0 4px'
              }}
              title="Log Usage"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', textAlign: 'right', color: remainingPercent < 10 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '500' }}>
          {remaining > 0 ? `${formatValue(remaining)} remaining` : 'Fully used!'}
        </div>
      </div>

      {showHistory && (
        <div style={{ marginTop: '10px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px' }}>
          {benefit.usages.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No entries yet</div>
          ) : (
            benefit.usages.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((usage) => (
              <div key={usage.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{formatValue(usage.amount)} - {usage.description}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(usage.date).toLocaleDateString()}</div>
                </div>
                <button 
                  onClick={() => onDeleteUsage(benefit.id, usage.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
