import { useState } from 'react';
import type { CreditCard, BenefitUsage, PeriodType, ResetFrequency } from './types/index';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BenefitItem } from './components/BenefitItem';
import { AddCardModal } from './components/AddCardModal';
import { Plus, CreditCard as CardIcon, Trash, Clock, ChevronDown, ChevronUp, User, Check, X as CloseIcon, Calendar } from 'lucide-react';
import { getDaysRemaining, getStatusColor, calculateCurrentUsedAmount, getPeriodEndDate } from './utils/dateUtils';
import { getDisplayCardName, getDisplayBenefitName } from './utils/stringUtils';
import { normalizeCard } from './utils/migrationUtils';
import { FLAGS } from './config';
import './styles/App.css';

function App() {
  const [storedCards, setCards] = useLocalStorage<CreditCard[]>('cc-benefits', []);
  
  // Normalize data (Migration)
  const cards = storedCards.map(normalizeCard);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'expiring' | 'category' | 'cards' | 'profile'>('expiring');

  // Management State
  const [addingBenefitTo, setAddingBenefitTo] = useState<string | null>(null);
  const [newBName, setNewBName] = useState('');
  const [newBAmount, setNewBAmount] = useState('');
  const [newBResetType, setNewBResetType] = useState<string>('calendar_annually');
  const [newBIntervalMonths, setNewBIntervalMonths] = useState<string>('48');
  const [newBIssueDate, setNewBIssueDate] = useState<string>('');
  const [editingAnniversaryFor, setEditingAnniversaryFor] = useState<string | null>(null);
  const [tempAnniversary, setNewTempAnniversary] = useState('');

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Are you sure you want to delete this card and all its benefits?')) {
      setCards(storedCards.filter(c => c.id !== cardId));
    }
  };

  const handleUpdateAnniversary = (cardId: string, newDate: string) => {
    setCards(storedCards.map(card => {
      if (card.id === cardId) {
        return { ...card, anniversaryDate: new Date(newDate).toISOString(), isAnniversarySet: true };
      }
      return card;
    }));
  };

  const handleDeleteAnniversary = (cardId: string) => {
    setCards(storedCards.map(card => {
      if (card.id === cardId) {
        return { ...card, isAnniversarySet: false };
      }
      return card;
    }));
  };

  const handleSyncCards = (updatedCards: CreditCard[]) => {
    setCards(updatedCards);
  };

  const handleAddUsage = (cardId: string, benefitId: string, amount: number, description: string, date: string) => {
    setCards(storedCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          benefits: card.benefits.map(benefit => {
            if (benefit.id === benefitId) {
              const newUsage: BenefitUsage = {
                id: crypto.randomUUID(),
                amount,
                date,
                description,
              };
              return {
                ...benefit,
                usedAmount: benefit.usedAmount + amount,
                usages: [...benefit.usages, newUsage]
              };
            }
            return benefit;
          })
        };
      }
      return card;
    }));
  };

  const handleDeleteUsage = (cardId: string, benefitId: string, usageId: string) => {
    setCards(storedCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          benefits: card.benefits.map(benefit => {
            if (benefit.id === benefitId) {
              const usageToDelete = benefit.usages.find(u => u.id === usageId);
              const amountToSubtract = usageToDelete ? usageToDelete.amount : 0;
              return {
                ...benefit,
                usedAmount: benefit.usedAmount - amountToSubtract,
                usages: benefit.usages.filter(u => u.id !== usageId)
              };
            }
            return benefit;
          })
        };
      }
      return card;
    }));
  };

  const handleAddBenefit = (cardId: string, name: string, amount: number, frequency: ResetFrequency = 'annually', periodType: PeriodType = 'calendar', resetIntervalMonths?: number, issueDate?: string) => {
    setCards(storedCards.map(card => {
      if (card.id === cardId) {
        const newBenefit: any = {
          id: crypto.randomUUID(),
          name: getDisplayBenefitName(name),
          totalAmount: amount,
          usedAmount: 0,
          frequency,
          periodType,
          category: 'Other',
          usages: [],
          lastResetDate: new Date().toISOString(),
          resetIntervalMonths,
          issueDate: issueDate ? new Date(issueDate).toISOString() : undefined
        };
        return { ...card, benefits: [...card.benefits, newBenefit] };
      }
      return card;
    }));
  };

  // Calculate stats
  const lifetimeSavings = cards.reduce((acc, card) => 
    acc + card.benefits.reduce((bAcc, b) => 
      bAcc + b.usages.reduce((uAcc, u) => uAcc + u.amount, 0), 0), 0
  );

  const availableToday = cards.reduce((acc, card) => 
    acc + card.benefits.reduce((bAcc, b) => {
      const isMonetary = !b.unit || b.unit === '$';
      if (!isMonetary) return bAcc;
      const remaining = b.totalAmount - calculateCurrentUsedAmount(b, card.anniversaryDate);
      return bAcc + Math.max(0, remaining);
    }, 0), 0
  );

  // Grouping Logic
  const allBenefits = cards.flatMap(card => card.benefits.map(b => ({ 
    ...b, 
    cardName: getDisplayCardName(card.name, card.issuer), 
    cardId: card.id, 
    anniversaryDate: card.anniversaryDate 
  })));

  const nextExpiryBenefit = allBenefits
    .filter(b => (b.totalAmount - calculateCurrentUsedAmount(b, b.anniversaryDate)) > 0)
    .sort((a, b) => getDaysRemaining(a, a.anniversaryDate) - getDaysRemaining(b, b.anniversaryDate))[0];

  const nextExpiryDays = nextExpiryBenefit ? getDaysRemaining(nextExpiryBenefit, nextExpiryBenefit.anniversaryDate) : null;
  
  const groupedByExpiry = allBenefits.reduce((acc, b) => {
    const days = getDaysRemaining(b, b.anniversaryDate);
    const isUsed = (b.totalAmount - calculateCurrentUsedAmount(b, b.anniversaryDate)) <= 0;
    
    let group = 'Later';
    if (isUsed) group = 'Fully Used';
    else if (days <= 7) group = 'Expiring within 7 days';
    else if (days <= 30) group = 'Expiring within 30 days';
    else if (days <= 90) group = 'Expiring within 90 days';
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(b);
    return acc;
  }, {} as Record<string, any[]>);

  const expiryOrder = ['Expiring within 7 days', 'Expiring within 30 days', 'Expiring within 90 days', 'Later', 'Fully Used'];
  const orderedGroupedByExpiry = expiryOrder.reduce((acc, key) => {
    if (groupedByExpiry[key]) acc[key] = groupedByExpiry[key];
    return acc;
  }, {} as Record<string, any[]>);

  const groupedByCategory = allBenefits.reduce((acc, b) => {
    const cat = b.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {} as Record<string, any[]>);

  const groupedByCard = cards.reduce((acc, card) => {
    const displayName = getDisplayCardName(card.name, card.issuer);
    acc[`${card.id}|${displayName}`] = card.benefits.map(b => ({ 
      ...b, 
      cardName: displayName, 
      cardId: card.id, 
      anniversaryDate: card.anniversaryDate 
    }));
    return acc;
  }, {} as Record<string, any[]>);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showGlobalExpiryDate, setShowGlobalExpiryDate] = useState(false);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleExpiryDisplay = () => {
    setShowGlobalExpiryDate(prev => !prev);
  };

  const renderGroupedView = (groups: Record<string, any[]>, hideCardLabel = false) => {
    if (cards.length === 0) return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        No benefits found. Start by adding a card in the Profile tab!
      </div>
    );

    return Object.entries(groups).map(([groupKey, benefits]) => {
      const isByCard = activeTab === 'cards';
      const isByExpiry = activeTab === 'expiring';
      const [_, name] = isByCard ? groupKey.split('|') : [null, groupKey];
      const group = name || groupKey;

      let groupTotal = 0;
      let groupRemaining = 0;
      
      benefits.forEach(b => {
        const isMonetary = !b.unit || b.unit === '$';
        if (isMonetary) {
          groupTotal += b.totalAmount;
          groupRemaining += (b.totalAmount - calculateCurrentUsedAmount(b, b.anniversaryDate));
        }
      });
      
      const remainingPercent = groupTotal > 0 ? (groupRemaining / groupTotal) * 100 : 100;

      const getHeaderStatusColor = () => {
        if (remainingPercent < 10) return 'var(--status-red)';
        if (remainingPercent < 40) return 'var(--status-yellow)';
        return 'var(--status-green)';
      };
      
      const isCollapsed = collapsedGroups[groupKey];

      return (
        <div key={groupKey} style={{ marginBottom: '2rem' }}>
          <div className="group-header" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => toggleGroup(groupKey)}>
              {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{group}</span>
              {group !== 'Fully Used' && (
                <span className="badge" style={{ backgroundColor: getHeaderStatusColor(), color: 'var(--text-main)', border: 'none', fontWeight: 'bold' }}>
                  ${groupRemaining.toFixed(2)} remaining
                </span>
              )}
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="card-grid">
              {benefits.map(b => {
                const daysLeft = getDaysRemaining(b, b.anniversaryDate);
                const isFullyUsed = (b.totalAmount - calculateCurrentUsedAmount(b, b.anniversaryDate)) <= 0;
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
                            onClick={(isFullyUsed || b.frequency === 'interval') ? undefined : toggleExpiryDisplay}
                          >
                            <Clock size={10} />
                            {b.frequency === 'interval' 
                              ? (isFullyUsed 
                                  ? `Available on ${getPeriodEndDate(b, b.anniversaryDate).toLocaleDateString()}` 
                                  : 'Available now')
                              : (showGlobalExpiryDate || isFullyUsed) 
                                ? (isFullyUsed 
                                    ? `Resets ${getPeriodEndDate(b, b.anniversaryDate).toLocaleDateString()}`
                                    : getPeriodEndDate(b, b.anniversaryDate).toLocaleDateString())
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
                      onAddUsage={(bId, amt, desc, date) => handleAddUsage(b.cardId, bId, amt, desc, date)}
                      onDeleteUsage={(bId, uId) => handleDeleteUsage(b.cardId, bId, uId)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const renderProfile = () => {
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
                              <button 
                                onClick={() => {
                                  handleUpdateAnniversary(card.id, tempAnniversary || card.anniversaryDate.split('T')[0]);
                                  setEditingAnniversaryFor(null);
                                  setNewTempAnniversary('');
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              {card.isAnniversarySet && (
                                <button 
                                  onClick={() => {
                                    handleDeleteAnniversary(card.id);
                                    setEditingAnniversaryFor(null);
                                    setNewTempAnniversary('');
                                  }}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                  title="Delete Anniversary Date"
                                >
                                  <CloseIcon size={16} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingAnniversaryFor(card.id);
                                setNewTempAnniversary(card.anniversaryDate.split('T')[0]);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                              title={`Anniversary: ${new Date(card.anniversaryDate).toLocaleDateString()}`}
                            >
                              <Calendar size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCard(card.id)} className="btn-outline" style={{ color: 'var(--danger)', padding: '6px' }}>
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
                              value={newBResetType} 
                              onChange={e => setNewBResetType(e.target.value)}
                              style={{ flex: 2, padding: '4px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                            >
                              <option value="calendar_monthly">Monthly (Calendar)</option>
                              <option value="calendar_quarterly">Quarterly (Calendar)</option>
                              <option value="calendar_semi_annually">Semi-Annual (Calendar)</option>
                              <option value="calendar_annually">Annual (Calendar Year)</option>
                              <option value="rolling_annually">Annual (Rolling / Anniversary)</option>
                              <option value="rolling_anniversary">Anniversary</option>
                              <option value="rolling_interval">Interval</option>
                            </select>
                            
                            {(newBResetType === 'rolling_anniversary' || newBResetType === 'rolling_interval') && (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input 
                                  type="number"
                                  placeholder="Months"
                                  value={newBIntervalMonths}
                                  onChange={e => setNewBIntervalMonths(e.target.value)}
                                  style={{ width: '60px', padding: '4px 8px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  title="Reset interval in months"
                                />
                                {newBResetType === 'rolling_anniversary' && (
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
                                  const [period, freq] = newBResetType.split('_');
                                  const frequency = (newBResetType === 'rolling_anniversary' ? 'anniversary' : (newBResetType === 'rolling_interval' ? 'interval' : freq)) as ResetFrequency;
                                  const periodType = period as PeriodType;
                                  const intervalMonths = (newBResetType === 'rolling_anniversary' || newBResetType === 'rolling_interval') ? parseInt(newBIntervalMonths) : undefined;
                                  
                                  handleAddBenefit(card.id, newBName, parseFloat(newBAmount), frequency, periodType, intervalMonths, newBIssueDate);
                                  setAddingBenefitTo(null);
                                  setNewBName('');
                                  setNewBAmount('');
                                  setNewBResetType('calendar_annually');
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

  return (
    <div className="app-container">
      <header>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CardIcon size={32} color="var(--primary)" />
            Benefit Tracker
          </h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Monitor your credit card credits</p>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'expiring' ? 'active' : ''}`} onClick={() => setActiveTab('expiring')}>
          Expiring Soon
        </button>
        <button className={`tab ${activeTab === 'category' ? 'active' : ''}`} onClick={() => setActiveTab('category')}>
          By Category
        </button>
        <button className={`tab ${activeTab === 'cards' ? 'active' : ''}`} onClick={() => setActiveTab('cards')}>
          By Card
        </button>
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`} 
          onClick={() => setActiveTab('profile')}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <User size={18} />
          Profile
        </button>
      </div>

      {activeTab !== 'profile' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Next Expiry</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: nextExpiryDays !== null ? getStatusColor(nextExpiryDays) : 'var(--success)' }}>
              {nextExpiryDays !== null ? `${nextExpiryDays} days` : 'N/A'}
            </div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Available Today</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#06b6d4' }}>${availableToday.toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Lifetime Savings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d946ef' }}>${lifetimeSavings.toFixed(2)}</div>
          </div>
        </section>
      )}

      {activeTab === 'expiring' && renderGroupedView(orderedGroupedByExpiry)}
      {activeTab === 'category' && renderGroupedView(groupedByCategory)}
      {activeTab === 'cards' && renderGroupedView(groupedByCard, true)}
      {activeTab === 'profile' && renderProfile()}
      
      {isModalOpen && (
        <AddCardModal 
          onClose={() => setIsModalOpen(false)} 
          currentCards={storedCards}
          onSync={handleSyncCards} 
        />
      )}
    </div>
  );
}


export default App;
