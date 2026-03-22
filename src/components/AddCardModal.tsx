import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import type { CreditCard } from '../types/index';
import { PREPOPULATED_CARDS } from '../data/prepopulatedCards';
import { FLAGS } from '../config';

interface AddCardModalProps {
  onClose: () => void;
  currentCards: CreditCard[];
  onSync: (updatedCards: CreditCard[]) => void;
}

// Helper to clean card names for display
const getDisplayCardName = (cardName: string, issuer: string) => {
  return cardName
    .replace(new RegExp(`^${issuer}\\s+`, 'i'), '')
    .replace(/\s*\(.*\)$/, '');
};

export const AddCardModal: React.FC<AddCardModalProps> = ({ onClose, currentCards, onSync }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track selected template IDs. 
  // Initial state is derived from currentCards' templateId or name matching.
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    currentCards.forEach(c => {
      // Find template match
      const template = PREPOPULATED_CARDS.find(p => p.id === c.templateId || p.name === c.name);
      if (template) ids.add(template.id);
    });
    return ids;
  });

  const filteredPopularCards = PREPOPULATED_CARDS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCard = (card: CreditCard) => {
    const id = card.id; // Prepopulated cards use their fixed ID
    const newSelected = new Set(selectedTemplateIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTemplateIds(newSelected);
  };

  const handleSave = () => {
    const updatedCards: CreditCard[] = [];

    // 1. Keep existing cards that are still selected
    currentCards.forEach(card => {
      const template = PREPOPULATED_CARDS.find(p => p.id === card.templateId || p.name === card.name);
      if (template && selectedTemplateIds.has(template.id)) {
        updatedCards.push(card);
      }
    });

    // 2. Add new cards from templates that aren't already in updatedCards
    selectedTemplateIds.forEach(tid => {
      const alreadyExists = updatedCards.some(c => c.templateId === tid || c.name === PREPOPULATED_CARDS.find(p => p.id === tid)?.name);
      if (!alreadyExists) {
        const template = PREPOPULATED_CARDS.find(p => p.id === tid);
        if (template) {
          updatedCards.push({
            ...template,
            id: crypto.randomUUID(),
            templateId: template.id,
            anniversaryDate: new Date().toISOString(),
            benefits: template.benefits.map(b => ({ ...b, id: crypto.randomUUID() }))
          });
        }
      }
    });

    onSync(updatedCards);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'white', zIndex: 1, paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0 }}>Manage Your Cards</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input 
                placeholder="Search popular cards..." 
                style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box', height: '40px', fontSize: '0.95rem' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            {FLAGS.SHOW_CUSTOM_CARD && (
              <button 
                className="btn btn-outline" 
                style={{ padding: '0 16px', height: '40px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                + Custom Card
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', maxHeight: '450px', overflowY: 'auto', padding: '4px' }}>
            {filteredPopularCards.map(card => {
              const isSelected = selectedTemplateIds.has(card.id);
              return (
                <div 
                  key={card.id} 
                  className={`card ${isSelected ? 'selected' : ''}`}
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer', 
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'white',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onClick={() => toggleCard(card)}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--primary)' }}>
                      <Check size={16} />
                    </div>
                  )}
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                    {getDisplayCardName(card.name, card.issuer)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{card.issuer}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
            <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};
