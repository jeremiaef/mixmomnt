'use client';

import { motion } from 'framer-motion';
import { PRESETS } from '@/lib/design';
import styles from './PresetSelector.module.css';

interface PresetSelectorProps {
  onSelect: (presetId: string) => void;
}

export default function PresetSelector({ onSelect }: PresetSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.title}>Choose a starting style</p>
        <p className={styles.subtitle}>
          You can change this anytime with the chat.
        </p>
      </div>
      <div className={styles.grid}>
        {PRESETS.map((preset, i) => (
          <motion.button
            key={preset.id}
            className={styles.card}
            onClick={() => onSelect(preset.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25 }}
            type="button"
          >
            {/* Mini wireframe preview */}
            <div
              className={styles.preview}
              style={{ '--accent': preset.accentColor } as React.CSSProperties}
            >
              <div className={styles.previewAvatar} />
              <div className={styles.previewLine} style={{ width: '60%' }} />
              <div className={styles.previewLine} style={{ width: '85%' }} />
              <div className={styles.previewGrid}>
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className={styles.previewCard}
                    style={{
                      opacity: preset.layoutDensity === 'compact' ? 0.6 : 1,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className={styles.cardBody}>
              <span className={styles.cardLabel}>{preset.label}</span>
              <span className={styles.cardDesc}>{preset.description}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
