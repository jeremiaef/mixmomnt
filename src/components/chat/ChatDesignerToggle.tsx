'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ChatPanel from './ChatPanel';
import styles from './ChatDesignerToggle.module.css';

interface ChatDesignerToggleProps {
  isOwnProfile: boolean;
}

export default function ChatDesignerToggle({ isOwnProfile }: ChatDesignerToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOwnProfile) return null;

  return (
    <>
      <button
        className={styles.editBtn}
        onClick={() => setIsOpen(true)}
        type="button"
        aria-label="Open Chat Designer"
      >
        <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
        Edit Portfolio
      </button>

      {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}
