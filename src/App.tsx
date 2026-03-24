import { useState, useMemo, useEffect } from 'react';
import { CreditCard as CardIcon, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';
import { BenefitGroup } from './components/BenefitGroup';
import { HeaderStats } from './components/HeaderStats';
import { NavigationTabs } from './components/NavigationTabs';
import { ProfileView } from './components/ProfileView';
import { AddCardModal } from './components/AddCardModal';
import { useCreditCards } from './hooks/useCreditCards';
import { useCloudSync } from './hooks/useCloudSync';
import { calculateDashboardStats } from './utils/statsUtils';
import { groupBenefitsByExpiry, groupBenefitsByCategory, groupBenefitsByCard } from './utils/groupingUtils';
import { TABS } from './constants';
import type { TabType } from './constants';
import './styles/App.css';

function App() {
  const { 
    cards, 
    storedCards,
    setStoredCards,
    deleteCard, 
    updateAnnualFeeDate, 
    deleteAnniversary, 
    syncCards, 
    addUsage, 
    deleteUsage, 
    addBenefit,
    updateBenefit
  } = useCreditCards();

  const { user, settings, syncStatus, loginWithGoogle, logout, updateSettings } = useCloudSync(storedCards, setStoredCards);

  // Auto-persist normalized changes back to stored state
  // This ensures that template updates (e.g. benefit removal/renaming) are pushed to the cloud
  useEffect(() => {
    if (storedCards.length > 0 && cards.length > 0) {
      const storedJson = JSON.stringify(storedCards);
      const normalizedJson = JSON.stringify(cards);
      
      if (storedJson !== normalizedJson) {
        // Use a small delay to avoid race conditions during initial load/sync
        const timeout = setTimeout(() => {
          setStoredCards(cards);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [cards, storedCards, setStoredCards]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize tab from hash if present
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const hash = window.location.hash.replace('#', '') as TabType;
    return Object.values(TABS).some(v => v === hash) ? hash : TABS.EXPIRING;
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Update hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleExpiryDisplay = () => {
    updateSettings({ showGlobalExpiryDate: !settings.showGlobalExpiryDate });
  };

  const stats = useMemo(() => calculateDashboardStats(cards), [cards]);

  const groupedBenefits = useMemo(() => {
    if (activeTab === TABS.EXPIRING) return groupBenefitsByExpiry(cards);
    if (activeTab === TABS.CATEGORY) return groupBenefitsByCategory(cards);
    if (activeTab === TABS.CARDS) return groupBenefitsByCard(cards);
    return {};
  }, [activeTab, cards]);

  if (!user && syncStatus !== 'loading') {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
        <CardIcon size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Benefit Tracker</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          Monitor your credit card credits and never let a benefit go to waste. 
          Sign in to securely back up your data and sync across all devices.
        </p>
        <button className="btn btn-primary" onClick={loginWithGoogle} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', fontSize: '1.1rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.5 }}>
          v1.0
        </div>
      </div>
    );
  }

  if (syncStatus === 'loading' && !user) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <RefreshCw size={48} className="spin" color="var(--primary)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Connecting to cloud...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === TABS.PROFILE) {
      return (
        <ProfileView 
          cards={cards}
          onDeleteCard={deleteCard}
          onUpdateAnnualFeeDate={updateAnnualFeeDate}
          onDeleteAnniversary={deleteAnniversary}
          onAddBenefit={addBenefit}
          onUpdateBenefit={updateBenefit}
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
        showGlobalExpiryDate={settings.showGlobalExpiryDate}
        onToggleExpiry={toggleExpiryDisplay}
        hideCardLabel={false}
        onAddUsage={addUsage}
        onDeleteUsage={deleteUsage}
        onUpdateBenefit={updateBenefit}
      />
    ));
  };

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.75rem' }}>
              <CardIcon size={28} color="var(--primary)" />
              Benefit Tracker
            </h1>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={14} color="var(--success)" />
                Cloud Synced
              </div>
              <button 
                onClick={logout}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px' }}
                title={`Signed in as ${user.email}`}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
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
