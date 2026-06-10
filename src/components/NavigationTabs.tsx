import React from 'react';
import { User, RefreshCw } from 'lucide-react';
import { TABS } from '../constants';
import type { TabType } from '../constants';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  return (
    <div className="tabs">
      <button className={`tab ${activeTab === TABS.EXPIRING ? 'active' : ''}`} onClick={() => setActiveTab(TABS.EXPIRING)}>
        Expiring Soon
      </button>
      <button className={`tab ${activeTab === TABS.CATEGORY ? 'active' : ''}`} onClick={() => setActiveTab(TABS.CATEGORY)}>
        By Category
      </button>
      <button className={`tab ${activeTab === TABS.CARDS ? 'active' : ''}`} onClick={() => setActiveTab(TABS.CARDS)}>
        By Card
      </button>
      <button
        className={`tab ${activeTab === TABS.SYNC ? 'active' : ''}`}
        onClick={() => setActiveTab(TABS.SYNC)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}
      >
        <RefreshCw size={15} />
        Sync
        {pendingCount > 0 && (
          <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '999px', fontSize: '0.65rem', padding: '0.05rem 0.4rem', fontWeight: 700, lineHeight: '1.4' }}>
            {pendingCount}
          </span>
        )}
      </button>
      <button
        className={`tab ${activeTab === TABS.PROFILE ? 'active' : ''}`}
        onClick={() => setActiveTab(TABS.PROFILE)}
        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <User size={18} />
        Profile
      </button>
    </div>
  );
};
