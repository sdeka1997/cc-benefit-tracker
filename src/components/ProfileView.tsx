import React, { useState } from 'react';
import { Plus, Trash, Calendar, Check, X as CloseIcon, AlertCircle, X } from 'lucide-react';
import type { CreditCard, ResetFrequency, PeriodType, Benefit } from '../types/index';
import { getDisplayCardName } from '../utils/stringUtils';
import { MinimalButton } from './MinimalButton';
import { FLAGS } from '../config';
import { STATUS_COLORS, RESET_TYPES } from '../constants';
import { needsAnniversaryDate } from '../utils/benefitMetrics';

interface CardManagementItemProps {
  card: CreditCard;
  onDeleteCard: (id: string) => void;
  onUpdateAnniversary: (id: string, date: string) => void;
  onDeleteAnniversary: (id: string) => void;
  onAddBenefit: (cardId: string, name: string, amount: number, freq: ResetFrequency, period: PeriodType, interval?: number, issueDate?: string) => void;
  onUpdateBenefit: (cardId: string, bId: string, updates: Partial<Benefit>) => void;
  addingBenefitTo: string | null;
  setAddingBenefitTo: (id: string | null) => void;
}

const CardManagementItem: React.FC<CardManagementItemProps> = ({
  card,
  onDeleteCard,
  onUpdateAnniversary,
  onDeleteAnniversary,
  onAddBenefit,
  onUpdateBenefit,
  addingBenefitTo,
  setAddingBenefitTo
}) => {
  const [isEditingAnniversary, setIsEditingAnniversary] = useState(false);
  const [tempAnniversary, setTempAnniversary] = useState(card.anniversaryDate ? card.anniversaryDate.split('T')[0] : '');
  const [showDateError, setShowDateError] = useState(false);
  
  const [newBName, setNewBName] = useState('');
  const [newBAmount, setNewBAmount] = useState('');
  const [newBResetTypeId, setNewBResetTypeId] = useState<string>(RESET_TYPES[3].id);
  const [newBIntervalMonths, setNewBIntervalMonths] = useState<string>('48');
  const [newBIssueDate, setNewBIssueDate] = useState<string>('');

  const selectedResetType = RESET_TYPES.find(t => t.id === newBResetTypeId) || RESET_TYPES[3];
  const cardNeedsInfo = !card.isAnniversarySet && card.benefits.some(needsAnniversaryDate);

  return (
    <div className={`card ${cardNeedsInfo ? 'needs-info' : ''}`} style={{ padding: '1.5rem' }}>
      {cardNeedsInfo && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          backgroundColor: 'rgba(245, 158, 11, 0.1)', 
          padding: '8px 12px', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <AlertCircle size={16} color="var(--warning)" />
          <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '500' }}>
            Action Required: Set your card's anniversary date to track benefits correctly.
          </span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>{getDisplayCardName(card.name, card.issuer)}</h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {isEditingAnniversary || !card.isAnniversarySet ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="var(--text-muted)" />
                  <input 
                    type="date" 
                    value={tempAnniversary} 
                    onChange={e => {
                      setTempAnniversary(e.target.value);
                      setShowDateError(false);
                    }}
                    style={{ 
                      height: '24px', 
                      padding: '0 4px', 
                      fontSize: '0.75rem', 
                      borderRadius: '4px', 
                      border: `1px solid ${showDateError ? 'var(--danger)' : 'var(--border-color)'}`, 
                      outline: showDateError ? '1px solid var(--danger)' : 'none' 
                    }}
                    autoFocus={isEditingAnniversary}
                  />
                  <button 
                    onClick={() => {
                      if (!tempAnniversary) {
                        setShowDateError(true);
                        return;
                      }
                      onUpdateAnniversary(card.id, tempAnniversary);
                      setIsEditingAnniversary(false);
                      setShowDateError(false);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                  {card.isAnniversarySet && (
                    <MinimalButton 
                      onClick={() => {
                        onDeleteAnniversary(card.id);
                        setIsEditingAnniversary(false);
                        setTempAnniversary(''); // Ensure the input is fully cleared
                        setShowDateError(false);
                      }}
                      color={STATUS_COLORS.MUTED}
                      title="Delete Anniversary Date"
                    >
                      <CloseIcon size={16} />
                    </MinimalButton>
                  )}
                </div>
              ) : (
                <MinimalButton 
                  onClick={() => {
                    setIsEditingAnniversary(true);
                    setTempAnniversary(card.anniversaryDate ? card.anniversaryDate.split('T')[0] : '');
                    setShowDateError(false);
                  }}
                  color="var(--primary)"
                  title={`Anniversary: ${new Date(card.anniversaryDate).toLocaleDateString()}`}
                >
                  <Calendar size={16} />
                </MinimalButton>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => onDeleteCard(card.id)} className="btn-outline" style={{ color: STATUS_COLORS.DANGER, padding: '6px', cursor: 'pointer' }}>
          <Trash size={18} />
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Benefits ({card.benefits.length})</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {card.benefits.map(b => (
            <button 
              key={b.id} 
              className="badge" 
              onClick={() => onUpdateBenefit(card.id, b.id, { isHidden: !b.isHidden })}
              style={{ 
                padding: '4px 10px', 
                fontSize: '0.8rem', 
                border: 'none', 
                cursor: 'pointer',
                textDecoration: b.isHidden ? 'line-through' : 'none',
                opacity: b.isHidden ? 0.5 : 1,
                backgroundColor: b.isHidden ? 'var(--border-color)' : 'var(--bg-color)',
                color: b.isHidden ? 'var(--text-muted)' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={b.isHidden ? "Click to unhide benefit" : "Click to hide benefit from tabs"}
            >
              {b.name}
              {b.isHidden && <X size={12} />}
            </button>
          ))}
        </div>
      </div>

      {FLAGS.SHOW_ADD_BENEFIT && (
        <div style={{ marginTop: '1rem' }}>
          {addingBenefitTo === card.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-color)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  placeholder="Benefit Name" 
                  value={newBName} 
                  onChange={e => setNewBName(e.target.value)}
                  style={{ flex: 2, padding: '4px 8px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  autoFocus
                />
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={newBAmount} 
                  onChange={e => setNewBAmount(e.target.value)} 
                  style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  value={newBResetTypeId} 
                  onChange={e => setNewBResetTypeId(e.target.value)}
                  style={{ flex: 2, padding: '4px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                >
                  {RESET_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                
                {(selectedResetType.hasInterval) && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number"
                      placeholder="Months"
                      value={newBIntervalMonths}
                      onChange={e => setNewBIntervalMonths(e.target.value)}
                      style={{ width: '60px', padding: '4px 8px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      title="Reset interval in months"
                    />
                    {selectedResetType.frequency === 'anniversary' && (
                      <input 
                        type="date"
                        value={newBIssueDate}
                        onChange={e => setNewBIssueDate(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        title="Issue Date"
                      />
                    )}
                  </div>
                )}

                <button 
                  className="btn-primary" 
                  style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                  onClick={() => {
                    if (newBName && newBAmount) {
                      onAddBenefit(
                        card.id, 
                        newBName, 
                        parseFloat(newBAmount), 
                        selectedResetType.frequency, 
                        selectedResetType.periodType, 
                        selectedResetType.hasInterval ? parseInt(newBIntervalMonths) : undefined, 
                        newBIssueDate
                      );
                      setAddingBenefitTo(null);
                      setNewBName('');
                      setNewBAmount('');
                      setNewBResetTypeId(RESET_TYPES[3].id);
                      setNewBIssueDate('');
                    }
                  }}
                >Add</button>
                <button 
                  className="btn-outline" 
                  style={{ padding: '4px 8px', fontSize: '0.85rem', border: 'none' }} 
                  onClick={() => setAddingBenefitTo(null)}
                >✕</button>
              </div>
            </div>
          ) : (
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', fontSize: '0.85rem', fontWeight: '500' }}
              onClick={() => setAddingBenefitTo(card.id)}
            >
              <Plus size={14} /> Add Benefit
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface ProfileViewProps {
  cards: CreditCard[];
  onDeleteCard: (id: string) => void;
  onUpdateAnniversary: (id: string, date: string) => void;
  onDeleteAnniversary: (id: string) => void;
  onAddBenefit: (cardId: string, name: string, amount: number, freq: ResetFrequency, period: PeriodType, interval?: number, issueDate?: string) => void;
  onUpdateBenefit: (cardId: string, bId: string, updates: Partial<Benefit>) => void;
  setIsModalOpen: (open: boolean) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  cards,
  onDeleteCard,
  onUpdateAnniversary,
  onDeleteAnniversary,
  onAddBenefit,
  onUpdateBenefit,
  setIsModalOpen
}) => {
  const [addingBenefitTo, setAddingBenefitTo] = useState<string | null>(null);

  return (
    <div className="profile-container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Card Management</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
          Manage Cards
        </button>
      </div>

      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No cards found. Add your first card to start tracking benefits.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[...cards].sort((a, b) => {
            const nameA = getDisplayCardName(a.name, a.issuer).toLowerCase();
            const nameB = getDisplayCardName(b.name, b.issuer).toLowerCase();
            return nameA.localeCompare(nameB);
          }).map(card => (
            <CardManagementItem 
              key={card.id}
              card={card}
              onDeleteCard={onDeleteCard}
              onUpdateAnniversary={onUpdateAnniversary}
              onDeleteAnniversary={onDeleteAnniversary}
              onAddBenefit={onAddBenefit}
              onUpdateBenefit={onUpdateBenefit}
              addingBenefitTo={addingBenefitTo}
              setAddingBenefitTo={setAddingBenefitTo}
            />
          ))}
        </div>
      )}
    </div>
  );
};
