'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { ChatMessage } from '@/lib/design';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import PresetSelector from './PresetSelector';
import { panelSlideIn } from '@/styles/motion';
import { motion } from 'framer-motion';
import styles from './ChatPanel.module.css';

// ─── State machine ───────────────────────────────────────────────────────────

type PanelState =
  | { phase: 'loading' }
  | { phase: 'presets' }
  | { phase: 'chat'; messages: ChatMessage[]; isProcessing: boolean };

type Action =
  | { type: 'PRESETS_SELECTED' }
  | { type: 'MESSAGE_SENT'; content: string }
  | { type: 'AI_STARTED' }
  | { type: 'AI_FINISHED'; explanation: string; aiMessageId: string }
  | { type: 'AI_ERROR' }
  | { type: 'UNDO_DONE' }
  | { type: 'RESET'; messages: ChatMessage[] };

function reducer(state: PanelState, action: Action): PanelState {
  switch (action.type) {
    case 'PRESETS_SELECTED':
      return { phase: 'chat', messages: [], isProcessing: false };
    case 'MESSAGE_SENT':
      if (state.phase !== 'chat') return state;
      return {
        ...state,
        isProcessing: true,
        messages: [
          ...state.messages,
          {
            id: `user-${Date.now()}`,
            role: 'user',
            content: action.content,
            timestamp: Date.now(),
          },
        ],
      };
    case 'AI_STARTED':
      if (state.phase !== 'chat') return state;
      return { ...state, isProcessing: true };
    case 'AI_FINISHED':
      if (state.phase !== 'chat') return state;
      return {
        ...state,
        isProcessing: false,
        messages: [
          ...state.messages,
          {
            id: action.aiMessageId,
            role: 'ai',
            content: action.explanation,
            timestamp: Date.now(),
          },
        ],
      };
    case 'AI_ERROR':
      if (state.phase !== 'chat') return state;
      return {
        ...state,
        isProcessing: false,
        messages: [
          ...state.messages,
          {
            id: `system-${Date.now()}`,
            role: 'system',
            content: 'Something went wrong. Try again.',
            timestamp: Date.now(),
          },
        ],
      };
    case 'UNDO_DONE':
      if (state.phase !== 'chat') return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `system-${Date.now()}`,
            role: 'system',
            content: 'Undone — reverted to previous state.',
            timestamp: Date.now(),
          },
        ],
      };
    case 'RESET':
      return { phase: 'chat', messages: action.messages, isProcessing: false };
    default:
      return state;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChatPanelProps {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const designData = useQuery(api.chat.getDesign);
  const sendMessageMutation = useMutation(api.chat.sendMessage);
  const applyDesignMutation = useMutation(api.chat.applyDesign);
  const applyPresetMutation = useMutation(api.chat.applyPreset);
  const undoMutation = useMutation(api.chat.undo);

  const [state, dispatch] = useReducer(reducer, { phase: 'loading' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAiMessageIdRef = useRef<string>('');

  // Initialize from Convex
  useEffect(() => {
    if (designData === undefined) return;
    if (!designData) {
      dispatch({ type: 'PRESETS_SELECTED' });
    } else {
      dispatch({ type: 'RESET', messages: designData.chatHistory ?? [] });
    }
  }, [designData]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state]);

  function handlePresetSelect(presetId: string) {
    applyPresetMutation({ presetId }).then(() => {
      dispatch({ type: 'PRESETS_SELECTED' });
    });
  }

  async function handleSend(content: string) {
    // Handle inline undo
    if (content.trim().toLowerCase() === 'undo') {
      try {
        await undoMutation({});
      } catch {
        // noop
      }
      dispatch({ type: 'UNDO_DONE' });
      return;
    }

    dispatch({ type: 'MESSAGE_SENT', content });

    try {
      const currentMessages =
        state.phase === 'chat' ? state.messages : [];
      const currentDesignJson = designData?.designJson ?? '{}';

      dispatch({ type: 'AI_STARTED' });

      const result = await sendMessageMutation({
        message: content,
        designJson: currentDesignJson,
        chatHistory: currentMessages,
      });

      await applyDesignMutation({
        patch: result.patch,
        explanation: result.explanation,
        userMessageId: result.userMessageId,
        aiMessageId: result.aiMessageId,
        chatHistory: currentMessages,
      });

      lastAiMessageIdRef.current = result.aiMessageId;
      dispatch({
        type: 'AI_FINISHED',
        explanation: result.explanation,
        aiMessageId: result.aiMessageId,
      });
    } catch {
      dispatch({ type: 'AI_ERROR' });
    }
  }

  function handleUndo() {
    undoMutation({}).then(() => {
      dispatch({ type: 'UNDO_DONE' });
    }).catch(() => {
      dispatch({ type: 'UNDO_DONE' });
    });
  }

  const isLastAiMessage = (msg: ChatMessage) => {
    if (msg.role !== 'ai') return false;
    return (
      state.phase === 'chat' &&
      state.messages.indexOf(msg) === state.messages.length - 1
    );
  };

  return (
    <motion.div
      className={styles.panel}
      variants={panelSlideIn}
      initial="hidden"
      animate="visible"
      role="complementary"
      aria-label="Chat Designer"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logoMark} aria-hidden="true">✦</span>
          <span className={styles.title}>Chat Designer</span>
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close Chat Designer"
          type="button"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Loading */}
        {state.phase === 'loading' && (
          <div className={styles.centerState}>
            <div className={styles.loadingDots}>
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Preset selector (first run) */}
        {state.phase === 'presets' && (
          <PresetSelector onSelect={handlePresetSelect} />
        )}

        {/* Chat */}
        {state.phase === 'chat' && (
          <>
            {state.messages.length === 0 ? (
              <div className={styles.emptyPrompt}>
                <p>Try:</p>
                <ul>
                  <li>"make it more minimal"</li>
                  <li>"add my Twitter link"</li>
                  <li>"change the accent to sage green"</li>
                </ul>
              </div>
            ) : (
              <div className={styles.messageThread} aria-live="polite">
                {state.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onUndo={handleUndo}
                    showUndo={isLastAiMessage(msg)}
                  />
                ))}
              </div>
            )}

            {state.isProcessing && (
              <div className={styles.typingWrapper}>
                <TypingIndicator />
              </div>
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Input (chat mode only) ───────────────────────────────── */}
      {state.phase === 'chat' && (
        <ChatInput onSend={handleSend} disabled={state.isProcessing} />
      )}
    </motion.div>
  );
}
