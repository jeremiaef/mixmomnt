'use client';

import { motion } from 'framer-motion';
import { messageIn } from '@/styles/motion';
import type { ChatMessage } from '@/lib/design';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  onUndo?: () => void;
  showUndo?: boolean;
}

export default function MessageBubble({
  message,
  onUndo,
  showUndo = false,
}: MessageBubbleProps) {
  if (message.role === 'system') {
    return (
      <motion.div
        className={styles.systemMessage}
        variants={messageIn}
        initial="hidden"
        animate="visible"
      >
        {message.content}
      </motion.div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`${styles.bubble} ${isUser ? styles.user : styles.ai}`}
      variants={messageIn}
      initial="hidden"
      animate="visible"
    >
      {message.role === 'ai' && (
        <span className={styles.aiAvatar} aria-hidden="true">
          ✦
        </span>
      )}
      <div className={styles.content}>
        <p className={styles.text}>{message.content}</p>
        {message.role === 'ai' && showUndo && onUndo && (
          <button className={styles.undoBtn} onClick={onUndo} type="button">
            Undo
          </button>
        )}
      </div>
    </motion.div>
  );
}
