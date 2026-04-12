'use client';

import { useState } from 'react';
import { TabBar, TabId } from './TabBar';
import { ReadmeRenderer } from './ReadmeRenderer';
import { LivePreviewFrame } from './LivePreviewFrame';
import styles from './ProjectTabContent.module.css';

interface ProjectTabContentProps {
  readme: string;
  liveUrl?: string | null;
  repoName: string;
}

export function ProjectTabContent({ readme, liveUrl, repoName }: ProjectTabContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('about');

  return (
    <div className={styles.wrapper}>
      <TabBar onTabChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'about' && (
          <div className={styles.about}>
            {readme ? (
              <ReadmeRenderer content={readme} />
            ) : (
              <p className={styles.empty}>No README yet.</p>
            )}
          </div>
        )}
        {activeTab === 'preview' && (
          <div className={styles.preview}>
            {liveUrl ? (
              <LivePreviewFrame liveUrl={liveUrl} repoName={repoName} />
            ) : (
              <p className={styles.empty}>No live site configured for this project.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}