'use client';

import { useState } from 'react';
import styles from './LivePreviewFrame.module.css';

interface LivePreviewFrameProps {
  liveUrl: string;
  repoName: string;
}

export function LivePreviewFrame({ liveUrl, repoName }: LivePreviewFrameProps) {
  const [iframeError, setIframeError] = useState(false);

  const handleReload = () => {
    setIframeError(false);
  };

  return (
    <div className={styles.wrapper}>
      {/* Browser chrome header */}
      <div className={styles.chrome}>
        {/* Traffic lights */}
        <div className={styles.trafficLights} aria-hidden="true">
          <span className={[styles.dot, styles.dotRed].join(' ')} />
          <span className={[styles.dot, styles.dotYellow].join(' ')} />
          <span className={[styles.dot, styles.dotGreen].join(' ')} />
        </div>

        {/* URL bar */}
        <div className={styles.urlBar}>
          <span className={styles.urlText}>{liveUrl}</span>
        </div>
      </div>

      {/* Preview area */}
      <div className={styles.preview}>
        {iframeError ? (
          <div className={styles.fallback}>
            <div className={styles.fallbackIcon} aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p className={styles.fallbackTitle}>Preview unavailable</p>
            <p className={styles.fallbackSubtitle}>
              The site may not allow embedding, or is temporarily unavailable.
            </p>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.visitButton}
            >
              Visit Site
            </a>
          </div>
        ) : (
          <iframe
            src={liveUrl}
            title={`Live preview of ${repoName}`}
            className={styles.iframe}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={() => setIframeError(true)}
            onLoad={() => setIframeError(false)}
          />
        )}
      </div>
    </div>
  );
}