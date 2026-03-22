import { useState, useMemo } from 'react';
import { CreditCard as CardIcon } from 'lucide-react';
import { BenefitGroup } from './components/BenefitGroup';
import { HeaderStats } from './components/HeaderStats';
import { NavigationTabs } from './components/NavigationTabs';
import { ProfileView } from './components/ProfileView';
import { AddCardModal } from './components/AddCardModal';
import { useCreditCards } from './hooks/useCreditCards';
import { calculateDashboardStats } from './utils/statsUtils';
import { groupBenefitsByExpiry, groupBenefitsByCategory, groupBenefitsByCard } from './utils/groupingUtils';
import { TABS } from './constants';
import type { TabType } from './constants';
import './styles/App.css';

function App() {
  const { 
    cards, 
    deleteCard, 
    updateAnniversary, 
    deleteAnniversary, 
    syncCards, 
    addUsage, 
    deleteUsage, 
    addBenefit 
  } = useCreditCards();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(TABS.EXPIRING);
  const [showGlobalExpiryDate, setShowGlobalExpiryDate] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleExpiryDisplay = () => {
    setShowGlobalExpiryDate(prev => !prev);
  };

  const stats = useMemo(() => calculateDashboardStats(cards), [cards]);

  const groupedBenefits = useMemo(() => {
    if (activeTab === TABS.EXPIRING) return groupBenefitsByExpiry(cards);
    if (activeTab === TABS.CATEGORY) return groupBenefitsByCategory(cards);
    if (activeTab === TABS.CARDS) return groupBenefitsByCard(cards);
    return {};
  }, [activeTab, cards]);

  const renderContent = () => {
    if (activeTab === TABS.PROFILE) {
      return (
        <ProfileView 
          cards={cards}
          onDeleteCard={deleteCard}
          onUpdateAnniversary={updateAnniversary}
          onDeleteAnniversary={deleteAnniversary}
          onAddBenefit={addBenefit}
          setIsModalOpen={setIsModalOpen}
        />
      );
    }

    if (cards.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No benefits found. Start by adding a card in the Profile tab!
        </div>
      );
    }

    return Object.entries(groupedBenefits).map(([groupKey, benefits]) => (
      <BenefitGroup
        key={groupKey}
        groupKey={groupKey}
        benefits={benefits}
        isCollapsed={collapsedGroups[groupKey] || false}
        onToggle={() => toggleGroup(groupKey)}
        isByExpiry={activeTab === TABS.EXPIRING}
        showGlobalExpiryDate={showGlobalExpiryDate}
        onToggleExpiry={toggleExpiryDisplay}
        hideCardLabel={activeTab === TABS.CARDS}
        onAddUsage={addUsage}
        onDeleteUsage={deleteUsage}
      />
    ));
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

      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab !== TABS.PROFILE && (
        <HeaderStats 
          lifetimeSavings={stats.lifetimeSavings}
          availableToday={stats.availableToday}
          nextExpiryDays={stats.nextExpiryDays}
        />
      )}

      {renderContent()}
      
      {isModalOpen && (
        <AddCardModal 
          onClose={() => setIsModalOpen(false)} 
          currentCards={cards}
          onSync={syncCards} 
        />
      )}
    </div>
  );
}

export default App;
