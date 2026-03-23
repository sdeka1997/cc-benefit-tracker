import React, { useState } from 'react';
import { Plus, Trash, Calendar, Check, X as CloseIcon } from 'lucide-react';
import type { CreditCard, ResetFrequency, PeriodType } from '../types/index';
import { getDisplayCardName } from '../utils/stringUtils';
import { MinimalButton } from './MinimalButton';
import { FLAGS } from '../config';
import { STATUS_COLORS, RESET_TYPES } from '../constants';

interface ProfileViewProps {
  cards: CreditCard[];
  onDeleteCard: (id: string) => void;
  onUpdateAnniversary: (id: string, date: string) => void;
  onDeleteAnniversary: (id: string) => void;
  onAddBenefit: (cardId: string, name: string, amount: number, freq: ResetFrequency, period: PeriodType, interval?: number, issueDate?: string) => void;
  setIsModalOpen: (open: boolean) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  cards,
  onDeleteCard,
  onUpdateAnniversary,
  onDeleteAnniversary,
  onAddBenefit,
  setIsModalOpen
}) => {
  const [addingBenefitTo, setAddingBenefitTo] = useState<string | null>(null);
  const [newBName, setNewBName] = useState('');
  const [newBAmount, setNewBAmount] = useState('');
  const [newBResetTypeId, setNewBResetTypeId] = useState<string>(RESET_TYPES[3].id); // Default to Annual Calendar
  const [newBIntervalMonths, setNewBIntervalMonths] = useState<string>('48');
  const [newBIssueDate, setNewBIssueDate] = useState<string>('');
  const [editingAnniversaryFor, setEditingAnniversaryFor] = useState<string | null>(null);
  const [tempAnniversary, setNewTempAnniversary] = useState('');

  const selectedResetType = RESET_TYPES.find(t => t.id === newBResetTypeId) || RESET_TYPES[3];

  return (
    <div className="profile-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
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
          {cards.map(card => {
            const cardNeedsInfo = !card.isAnniversarySet;
            return (
              <div key={card.id} className={`card ${cardNeedsInfo ? 'needs-info' : ''}`} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ margin: 0 }}>{getDisplayCardName(card.name, card.issuer)}</h3>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {editingAnniversaryFor === card.id || !card.isAnniversarySet ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <input 
                              type="date" 
                              value={tempAnniversary || (card.anniversaryDate ? card.anniversaryDate.split('T')[0] : '')} 
                              onChange={e => setNewTempAnniversary(e.target.value)}
                              style={{ height: '24px', padding: '0 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                              autoFocus={editingAnniversaryFor === card.id}
                            />
                            <MinimalButton 
                              onClick={() => {
                                onUpdateAnniversary(card.id, tempAnniversary || card.anniversaryDate.split('T')[0]);
                                setEditingAnniversaryFor(null);
                                setNewTempAnniversary('');
                              }}
                              color={STATUS_COLORS.SUCCESS}
                              title="Save"
                            >
                              <Check size={16} />
                            </MinimalButton>
                            {card.isAnniversarySet && (
                              <MinimalButton 
                                onClick={() => {
                                  onDeleteAnniversary(card.id);
                                  setEditingAnniversaryFor(null);
                                  setNewTempAnniversary('');
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
                              setEditingAnniversaryFor(card.id);
                              setNewTempAnniversary(card.anniversaryDate.split('T')[0]);
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
                      <span key={b.id} className="badge" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                        {b.name}: ${b.totalAmount}
                      </span>
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
          })}
        </div>
      )}
    </div>
  );
};
