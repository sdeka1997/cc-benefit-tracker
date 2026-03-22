import React from 'react';
import { User } from 'lucide-react';
import { TABS } from '../constants';
import type { TabType } from '../constants';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, setActiveTab }) => {
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
