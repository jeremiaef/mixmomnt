'use client';

import { useState } from 'react';
import styles from './TabBar.module.css';

export type TabId = 'about' | 'preview';

export interface TabBarProps {
  defaultTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'preview', label: 'Live Preview' },
];

export function TabBar({ defaultTab = 'about', onTabChange }: TabBarProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className={styles.tabBar} role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={[
            styles.tab,
            activeTab === tab.id ? styles.tabActive : '',
          ].join(' ')}
          onClick={() => handleTabClick(tab)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}