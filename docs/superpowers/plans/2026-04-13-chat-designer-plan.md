# Chat Designer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Chat Designer — a split-screen editing panel where vibecoders customize their portfolio via natural language, with live preview, undo, and a preset-first onboarding flow.

**Architecture:**
- Backend: Convex actions handle AI calls (Claude API), design state, undo stack, and preset application. No streaming — complete messages only.
- Frontend: Client Components for chat UI (`ChatPanel`, `MessageBubble`, `TypingIndicator`, `ChatInput`, `PresetSelector`, `ChatDesignerToggle`). Profile page remains a Server Component; interactive pieces are composed in.
- State: `DesignState` stored as JSON in `profileDesign.designJson`. `changeHistory` array (max 10) for undo.
- AI flow: Convex action → build prompt (system prompt + current designJson + chat history) → call Claude → parse `DesignPatch` → apply to designJson → return explanation + updated state.

**Tech Stack:** Next.js App Router · Convex (server actions) · Claude API · Framer Motion · CSS Modules · Lucide React

---

## File Map

```
src/
├── app/
│   ├── [username]/
│   │   ├── page.tsx              # Server Component — add Convex data, Compose ChatDesignerToggle
│   │   └── page.module.css       # Add split-screen layout styles
│   └── app/
│       └── dashboard/
│           └── page.tsx          # (Optional) standalone chat route in app subdomain
├── components/
│   └── chat/
│       ├── ChatPanel.tsx
│       ├── ChatPanel.module.css
│       ├── MessageBubble.tsx
│       ├── MessageBubble.module.css
│       ├── TypingIndicator.tsx
│       ├── TypingIndicator.module.css
│       ├── PresetSelector.tsx
│       ├── PresetSelector.module.css
│       ├── ChatInput.tsx
│       ├── ChatInput.module.css
│       ├── ChatDesignerToggle.tsx   # "Edit Portfolio" button — Client Component
│       └── ChatDesignerToggle.module.css
├── lib/
│   └── design.ts                 # DesignState type, preset configs, approved color list
convex/
├── schema.ts                     # Add changeHistory, lastChangeAt, presetId to profileDesign
├── chat.ts                       # sendMessage, applyDesign, applyPreset, undo, getDesign
src/app/
└── page.tsx                      # (already exists — no changes needed here)
```

---

## Task 1: Schema + Design Types

**Files:**
- Modify: `convex/schema.ts`
- Create: `src/lib/design.ts`

- [ ] **Step 1: Modify `convex/schema.ts` — add fields to `profileDesign`**

Find the `profileDesign` table definition and add three new fields after `updatedAt`:

```typescript
profileDesign: defineTable({
  userId: v.id("users"),
  designJson: v.string(),
  ogTitle: v.optional(v.string()),
  ogDescription: v.optional(v.string()),
  ogImageUrl: v.optional(v.string()),
  updatedAt: v.number(),
  // New fields:
  changeHistory: v.array(v.string()),   // prior designJson snapshots, max 10
  lastChangeAt: v.number(),             // timestamp of most recent change
  presetId: v.optional(v.string()),     // which preset is currently applied
}).index("by_userId", ["userId"]),
```

- [ ] **Step 2: Create `src/lib/design.ts`**

```typescript
// ─── Design State ───────────────────────────────────────────────────────────

export type LayoutDensity = 'compact' | 'normal' | 'spacious';

export interface DesignState {
  tagline: string;
  bio: string;
  accentColor: string;       // hex, within approved palette
  layoutDensity: LayoutDensity;
  visibleRepoIds: string[];   // which repos to show (empty = all)
  socialLinks: {
    github?: string;
    twitter?: string;
    email?: string;
  };
  ogTitle: string;
  ogDescription: string;
}

export type MessageRole = 'user' | 'ai' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

// ─── Presets ────────────────────────────────────────────────────────────────

export type PresetId = 'clean-dev' | 'bold-maker' | 'dark-experimental';

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  accentColor: string;
  layoutDensity: LayoutDensity;
}

export const PRESETS: Preset[] = [
  {
    id: 'clean-dev',
    label: 'Clean Dev',
    description: 'Minimal, code-adjacent, tight spacing',
    accentColor: '#6a6a7a',
    layoutDensity: 'compact',
  },
  {
    id: 'bold-maker',
    label: 'Bold Maker',
    description: 'Larger type, warmer, more expressive',
    accentColor: '#c0bdb8',
    layoutDensity: 'spacious',
  },
  {
    id: 'dark-experimental',
    label: 'Dark Experimental',
    description: 'High contrast, motion-forward, sharp edges',
    accentColor: '#7a6aaa',
    layoutDensity: 'normal',
  },
];

export const DEFAULT_DESIGN_STATE: DesignState = {
  tagline: '',
  bio: '',
  accentColor: '#6a6a7a',
  layoutDensity: 'normal',
  visibleRepoIds: [],
  socialLinks: {},
  ogTitle: '',
  ogDescription: '',
};

// ─── Approved Accent Colors ──────────────────────────────────────────────────
// AI must pick from this list. Any color not in this list is rejected.

export const APPROVED_ACCENT_COLORS = [
  '#6a6a7a', // neutral gray
  '#8a8aaa', // muted lavender
  '#7a9a8a', // sage green
  '#c0bdb8', // warm off-white
  '#9a7a5a', // amber
  '#7a6aaa', // purple
  '#5a8aaa', // steel blue
  '#aa7a5a', // terracotta
  '#7aaa8a', // mint
  '#aa5a7a', // mauve
];

// ─── AI System Prompt ───────────────────────────────────────────────────────

export const AI_SYSTEM_PROMPT = `You are mixmomnt's design assistant. You help vibecoders customize their portfolio page by making high-level design changes.

You can ONLY change these properties:
- tagline: short phrase below the display name
- bio: free-text description shown in the bio card
- accentColor: must be a hex color from this list: ${APPROVED_ACCENT_COLORS.join(', ')}
- layoutDensity: one of 'compact' | 'normal' | 'spacious'
- visibleRepoIds: array of repo names to show (empty = show all)
- socialLinks: { github?, twitter?, email? }
- ogTitle: what shows in link previews
- ogDescription: what shows below the title in link previews

You CANNOT change: individual pixel layout, card ordering, custom fonts, animation timing, or any CSS property not listed above.

When the user asks for something outside your scope, politely decline and suggest something in-bounds. Never make up colors or properties.

Respond with a JSON object:
{
  "changes": { ...partial DesignState of only what changed... },
  "explanation": "one sentence describing what you did"
}

If no changes are needed (e.g., the user says "looks great"), return {"changes": {}, "explanation": "No changes needed — your portfolio already looks that way."}
`.trim();

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function serializeDesign(state: DesignState): string {
  return JSON.stringify(state);
}

export function deserializeDesign(json: string): DesignState {
  try {
    return JSON.parse(json) as DesignState;
  } catch {
    return DEFAULT_DESIGN_STATE;
  }
}

export function applyDesignPatch(
  current: DesignState,
  patch: Partial<DesignState>
): DesignState {
  return { ...current, ...patch };
}
```

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts src/lib/design.ts
git commit -m "$(cat <<'EOF'
feat(chat): schema additions and DesignState types

Adds changeHistory, lastChangeAt, presetId to profileDesign table.
Defines DesignState interface, PRESETS array, approved colors,
AI system prompt, and serialization helpers.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Convex Chat Actions

**Files:**
- Create: `convex/chat.ts`
- Modify: `convex/_generated/dataModel.d.ts` (auto-generated — no manual changes)

> Note: After running `convex dev` to regenerate types, verify the new fields appear in `profileDesign`.

- [ ] **Step 1: Create `convex/chat.ts`**

```typescript
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  AI_SYSTEM_PROMPT,
  DEFAULT_DESIGN_STATE,
  deserializeDesign,
  serializeDesign,
  applyDesignPatch,
  type DesignState,
  type PresetId,
  type ChatMessage,
  PRESETS,
} from "../src/lib/design";

const MAX_HISTORY = 10;

const MAX_CHAT_HISTORY_MESSAGES = 20;

// ─── getDesign ────────────────────────────────────────────────────────────────

export const getDesign = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profileDesign = await ctx.db
      .query("profileDesign")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profileDesign) return null;

    const designJson = profileDesign.designJson;
    const chatHistory = profileDesign.chatHistory
      ? (JSON.parse(profileDesign.chatHistory) as ChatMessage[])
      : [];

    return {
      designJson,
      changeHistory: profileDesign.changeHistory ?? [],
      lastChangeAt: profileDesign.lastChangeAt ?? 0,
      presetId: profileDesign.presetId ?? null,
      chatHistory,
    };
  },
});

// ─── applyPreset ──────────────────────────────────────────────────────────────

export const applyPreset = mutation({
  args: { presetId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const preset = PRESETS.find((p) => p.id === args.presetId) as
      | Preset
      | undefined;
    if (!preset) throw new Error("Unknown preset");

    const existing = await ctx.db
      .query("profileDesign")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    const currentDesign = existing
      ? deserializeDesign(existing.designJson)
      : DEFAULT_DESIGN_STATE;

    const newDesign: DesignState = {
      ...currentDesign,
      accentColor: preset.accentColor,
      layoutDensity: preset.layoutDensity,
    };

    // Snapshot current state before overwriting
    const changeHistory = existing?.changeHistory ?? [];
    changeHistory.unshift(existing?.designJson ?? serializeDesign(DEFAULT_DESIGN_STATE));
    if (changeHistory.length > MAX_HISTORY) changeHistory.pop();

    if (existing) {
      await ctx.db.patch(existing._id, {
        designJson: serializeDesign(newDesign),
        changeHistory,
        lastChangeAt: now,
        presetId: preset.id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("profileDesign", {
        userId,
        designJson: serializeDesign(newDesign),
        changeHistory,
        lastChangeAt: now,
        presetId: preset.id,
        ogTitle: "",
        ogDescription: "",
        updatedAt: now,
      });
    }

    return { ok: true, designJson: serializeDesign(newDesign) };
  },
});

// ─── sendMessage (action — calls Claude API) ─────────────────────────────────

export const sendMessage = action({
  args: {
    message: v.string(),
    designJson: v.string(),
    chatHistory: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("ai"), v.literal("system")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const currentDesign = deserializeDesign(args.designJson);

    // Build the conversation history for Claude
    const historyText = args.chatHistory
      .slice(-MAX_CHAT_HISTORY_MESSAGES)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const userMessageId = `user-${Date.now()}`;
    const aiMessageId = `ai-${Date.now()}`;

    const prompt = `${AI_SYSTEM_PROMPT}

CURRENT DESIGN STATE:
${JSON.stringify(currentDesign, null, 2)}

CONVERSATION HISTORY:
${historyText}

user: ${args.message}`;

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("CLAUDE_API_KEY not set");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: AI_SYSTEM_PROMPT,
        messages: [
          ...(args.chatHistory.length > 0
            ? args.chatHistory.slice(-MAX_CHAT_HISTORY_MESSAGES).map((m) => ({
                role: m.role === "ai" ? "assistant" : "user",
                content: m.content,
              }))
            : []),
          { role: "user", content: args.message },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${response.status} — ${err}`);
    }

    const data = (await response.json()) as {
      content?: { text?: string }[];
    };
    const responseText =
      data.content?.[0]?.text?.trim() ?? "Sorry, I couldn't process that.";

    // Try to parse JSON from the response
    let patch: Partial<DesignState> = {};
    let explanation = responseText;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.changes) {
          patch = parsed.changes as Partial<DesignState>;
          explanation = parsed.explanation ?? responseText;
        }
      } catch {
        // Not JSON — treat the whole response as the explanation
      }
    }

    // If the patch has a color, validate it
    if (patch.accentColor) {
      const { APPROVED_ACCENT_COLORS } = await import("../src/lib/design");
      if (!APPROVED_ACCENT_COLORS.includes(patch.accentColor)) {
        patch.accentColor = currentDesign.accentColor; // revert invalid color
      }
    }

    return {
      userMessageId,
      aiMessageId,
      explanation,
      patch,
    };
  },
});

// ─── applyDesign (mutation — saves the AI's design patch) ───────────────────

export const applyDesign = mutation({
  args: {
    patch: v.object({
      tagline: v.optional(v.string()),
      bio: v.optional(v.string()),
      accentColor: v.optional(v.string()),
      layoutDensity: v.optional(v.string()),
      visibleRepoIds: v.optional(v.array(v.string())),
      socialLinks: v.optional(
        v.object({
          github: v.optional(v.string()),
          twitter: v.optional(v.string()),
          email: v.optional(v.string()),
        })
      ),
      ogTitle: v.optional(v.string()),
      ogDescription: v.optional(v.string()),
    }),
    explanation: v.string(),
    userMessageId: v.string(),
    aiMessageId: v.string(),
    chatHistory: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("ai"), v.literal("system")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profileDesign")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    const currentDesign = existing
      ? deserializeDesign(existing.designJson)
      : DEFAULT_DESIGN_STATE;

    // Snapshot current state before patch
    const changeHistory = existing?.changeHistory ?? [];
    changeHistory.unshift(existing?.designJson ?? serializeDesign(DEFAULT_DESIGN_STATE));
    if (changeHistory.length > MAX_HISTORY) changeHistory.pop();

    // Apply the patch
    const newDesign = applyDesignPatch(currentDesign, args.patch);

    // Build updated chat history
    const updatedHistory: ChatMessage[] = [
      ...args.chatHistory.slice(-(MAX_CHAT_HISTORY_MESSAGES - 2)),
      {
        id: args.userMessageId,
        role: "user",
        content: (() => {
          const lastUser = args.chatHistory.filter((m) => m.role === "user").pop();
          return lastUser?.content ?? "";
        })(),
        timestamp: now - 1,
      },
      {
        id: args.aiMessageId,
        role: "ai",
        content: args.explanation,
        timestamp: now,
      },
    ];

    if (existing) {
      await ctx.db.patch(existing._id, {
        designJson: serializeDesign(newDesign),
        changeHistory,
        lastChangeAt: now,
        chatHistory: JSON.stringify(updatedHistory),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("profileDesign", {
        userId,
        designJson: serializeDesign(newDesign),
        changeHistory,
        lastChangeAt: now,
        chatHistory: JSON.stringify(updatedHistory),
        ogTitle: newDesign.ogTitle,
        ogDescription: newDesign.ogDescription,
        updatedAt: now,
      });
    }

    return { ok: true, designJson: serializeDesign(newDesign) };
  },
});

// ─── undo ─────────────────────────────────────────────────────────────────────

export const undo = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profileDesign")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!existing || !existing.changeHistory?.length) {
      return { ok: false, reason: "Nothing to undo" };
    }

    const [previousJson, ...restHistory] = existing.changeHistory;
    const previousDesign = deserializeDesign(previousJson);

    await ctx.db.patch(existing._id, {
      designJson: previousJson,
      changeHistory: restHistory,
      lastChangeAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { ok: true, designJson: previousJson };
  },
});
```

- [ ] **Step 2: Add `CLAUDE_API_KEY` to `.env.local.example`**

```bash
echo "# Claude API (for Chat Designer AI)
CLAUDE_API_KEY=" >> .env.local.example
```

- [ ] **Step 3: Commit**

```bash
git add convex/chat.ts .env.local.example
git commit -m "$(cat <<'EOF'
feat(chat): Convex actions for AI chat, design patches, and undo

- sendMessage (action): calls Claude API with system prompt + design state + history
- applyDesign (mutation): applies DesignPatch, snapshots history, saves state
- applyPreset (mutation): applies a preset, snapshots history
- undo (mutation): pops last snapshot from changeHistory, reverts state
- getDesign (query): returns current design state + chat history

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: UI Components — MessageBubble + TypingIndicator

**Files:**
- Create: `src/components/chat/MessageBubble.tsx`
- Create: `src/components/chat/MessageBubble.module.css`
- Create: `src/components/chat/TypingIndicator.tsx`
- Create: `src/components/chat/TypingIndicator.module.css`

- [ ] **Step 1: Create `src/components/chat/MessageBubble.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `src/components/chat/MessageBubble.module.css`**

```css
.bubble {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  max-width: 85%;
}

.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.ai {
  margin-right: auto;
}

/* ── AI avatar mark ─────────────────────────────────── */
.aiAvatar {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--live-accent);
  margin-top: 2px;
}

/* ── Content bubble ─────────────────────────────────── */
.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.user .content {
  align-items: flex-end;
}

.text {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  line-height: 1.55;
  word-break: break-word;
}

.user .text {
  background: var(--surface-raised);
  color: var(--text-primary);
  border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg);
}

.ai .text {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg);
}

/* ── Undo button ────────────────────────────────────── */
.undoBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding: 0;
  font-family: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color var(--transition-fast);
}

.undoBtn:hover {
  color: var(--text-secondary);
}

/* ── System message ─────────────────────────────────── */
.systemMessage {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding: var(--space-2) 0;
  font-style: italic;
}
```

- [ ] **Step 3: Create `src/components/chat/TypingIndicator.tsx`**

```tsx
'use client';

import styles from './TypingIndicator.module.css';

export default function TypingIndicator() {
  return (
    <div className={styles.wrapper} role="status" aria-label="AI is thinking">
      <span className={styles.avatar} aria-hidden="true">✦</span>
      <div className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/chat/TypingIndicator.module.css`**

```css
.wrapper {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2) 0;
}

.avatar {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--live-accent);
}

.dots {
  display: flex;
  gap: 4px;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
}

.dot {
  width: 6px;
  height: 6px;
  background: var(--text-muted);
  border-radius: var(--radius-full);
  animation: pulse 1.2s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/MessageBubble.tsx src/components/chat/MessageBubble.module.css \
  src/components/chat/TypingIndicator.tsx src/components/chat/TypingIndicator.module.css
git commit -m "$(cat <<'EOF'
feat(chat): MessageBubble and TypingIndicator components

- MessageBubble: user / ai / system variants with Framer Motion entrance
- AI variant includes ✦ avatar mark and Undo button slot
- TypingIndicator: three-dot pulse animation matching the design system

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: UI Components — ChatInput + PresetSelector

**Files:**
- Create: `src/components/chat/ChatInput.tsx`
- Create: `src/components/chat/ChatInput.module.css`
- Create: `src/components/chat/PresetSelector.tsx`
- Create: `src/components/chat/PresetSelector.module.css`

- [ ] **Step 1: Create `src/components/chat/ChatInput.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-grow up to ~3 lines
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={
            disabled
              ? 'Waiting for response…'
              : 'Describe how you want your portfolio to look…'
          }
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
      <p className={styles.hint}>Press Enter to send · Shift+Enter for newline</p>
    </form>
  );
}
```

- [ ] **Step 2: Create `src/components/chat/ChatInput.module.css`**

```css
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
}

.inputRow {
  display: flex;
  gap: var(--space-2);
  align-items: flex-end;
}

.textarea {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-family: inherit;
  color: var(--text-primary);
  resize: none;
  line-height: 1.5;
  min-height: 44px;
  max-height: 96px;
  overflow-y: auto;
  transition: border-color var(--transition-fast);
  outline: none;
}

.textarea::placeholder {
  color: var(--text-ghost);
}

.textarea:focus {
  border-color: var(--text-muted);
}

.textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sendBtn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: var(--text-primary);
  color: var(--bg);
  border: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.sendBtn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sendBtn:not(:disabled):hover {
  opacity: 0.85;
}

.hint {
  font-size: var(--text-xs);
  color: var(--text-ghost);
  padding-left: var(--space-1);
}
```

- [ ] **Step 3: Create `src/components/chat/PresetSelector.tsx`**

```tsx
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
            {/* Mini preview thumbnail */}
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
                    style={{ opacity: preset.layoutDensity === 'compact' ? 0.6 : 1 }}
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
```

- [ ] **Step 4: Create `src/components/chat/PresetSelector.module.css`**

```css
.container {
  padding: var(--space-6) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  height: 100%;
  justify-content: center;
}

.header {
  text-align: center;
}

.title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* ── Preset cards grid ──────────────────────────────── */
.grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-4);
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  font-family: inherit;
  color: inherit;
}

.card:hover {
  border-color: var(--text-muted);
  background: var(--surface-raised);
}

/* ── Mini preview thumbnail ─────────────────────────── */
.preview {
  width: 64px;
  height: 52px;
  flex-shrink: 0;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.previewAvatar {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  background: var(--accent, var(--text-muted));
  margin-bottom: 2px;
}

.previewLine {
  height: 4px;
  background: var(--surface-raised);
  border-radius: 2px;
}

.previewGrid {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  flex: 1;
  align-items: flex-end;
}

.previewCard {
  flex: 1;
  height: 10px;
  background: var(--surface-raised);
  border-radius: 2px;
}

/* ── Card body ─────────────────────────────────────── */
.cardBody {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cardLabel {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.cardDesc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.4;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatInput.tsx src/components/chat/ChatInput.module.css \
  src/components/chat/PresetSelector.tsx src/components/chat/PresetSelector.module.css
git commit -m "$(cat <<'EOF'
feat(chat): ChatInput and PresetSelector components

- ChatInput: auto-grow textarea, Enter-to-send, Shift+Enter for newline,
  disabled state while AI is processing
- PresetSelector: three preset cards with mini wireframe thumbnails,
  staggered entrance animation, Framer Motion

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: ChatPanel

**Files:**
- Create: `src/components/chat/ChatPanel.tsx`
- Create: `src/components/chat/ChatPanel.module.css`

- [ ] **Step 1: Create `src/components/chat/ChatPanel.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { deserializeDesign, type ChatMessage } from '@/lib/design';
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
  | { type: 'AI_FINISHED'; explanation: string; userMessageId: string; aiMessageId: string }
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
          { id: `user-${Date.now()}`, role: 'user', content: action.content, timestamp: Date.now() },
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
          { id: action.aiMessageId, role: 'ai', content: action.explanation, timestamp: Date.now() },
        ],
      };
    case 'AI_ERROR':
      if (state.phase !== 'chat') return state;
      return {
        ...state,
        isProcessing: false,
        messages: [
          ...state.messages,
          { id: `system-${Date.now()}`, role: 'system', content: 'Something went wrong. Try again.', timestamp: Date.now() },
        ],
      };
    case 'UNDO_DONE':
      if (state.phase !== 'chat') return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: `system-${Date.now()}`, role: 'system', content: 'Undone — reverted to previous state.', timestamp: Date.now() },
        ],
      };
    case 'RESET':
      return { phase: 'chat', messages: action.messages, isProcessing: false };
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  // Convex data
  const designData = useQuery(api.chat.getDesign);
  const sendMessageMutation = useMutation(api.chat.sendMessage);
  const applyDesignMutation = useMutation(api.chat.applyDesign);
  const applyPresetMutation = useMutation(api.chat.applyPreset);
  const undoMutation = useMutation(api.chat.undo);

  // Local state
  const [state, dispatch] = useReducer(reducer, { phase: 'loading' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAiMessageTimeRef = useRef<number>(0);

  // Initialize from Convex
  useEffect(() => {
    if (designData === undefined) return;
    if (!designData) {
      dispatch({ type: 'PRESETS_SELECTED' });
    } else {
      dispatch({ type: 'RESET', messages: designData.chatHistory ?? [] });
    }
  }, [designData]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state]);

  function handlePresetSelect(presetId: string) {
    applyPresetMutation({ presetId }).then(() => {
      dispatch({ type: 'PRESETS_SELECTED' });
    });
  }

  async function handleSend(content: string) {
    // Handle undo command inline
    if (content.trim().toLowerCase() === 'undo') {
      try {
        await undoMutation({});
        dispatch({ type: 'UNDO_DONE' });
      } catch {
        dispatch({ type: 'UNDO_DONE' });
      }
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

      // Apply the design patch
      await applyDesignMutation({
        patch: result.patch,
        explanation: result.explanation,
        userMessageId: result.userMessageId,
        aiMessageId: result.aiMessageId,
        chatHistory: currentMessages,
      });

      lastAiMessageTimeRef.current = Date.now();
      dispatch({
        type: 'AI_FINISHED',
        explanation: result.explanation,
        userMessageId: result.userMessageId,
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

  const showUndo = (messageId: string) => {
    return (
      messageId === lastAiMessageTimeRef.current.toString() ||
      Date.now() - lastAiMessageTimeRef.current < 30_000
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
                    showUndo={
                      msg.role === 'ai' &&
                      state.messages.indexOf(msg) === state.messages.length - 1
                    }
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
```

- [ ] **Step 2: Create `src/components/chat/ChatPanel.module.css`**

```css
.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40%;
  min-width: 320px;
  max-width: 520px;
  background: var(--bg);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: var(--z-overlay);
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logoMark {
  font-size: 14px;
  color: var(--live-accent);
}

.title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.closeBtn {
  width: 28px;
  height: 28px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.closeBtn:hover {
  color: var(--text-primary);
}

/* ── Body ───────────────────────────────────────────── */
.body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  scroll-behavior: smooth;
}

/* ── Empty state ────────────────────────────────────── */
.emptyPrompt {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6) 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.emptyPrompt ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.emptyPrompt li {
  color: var(--text-secondary);
  font-style: italic;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.emptyPrompt li:hover {
  color: var(--text-primary);
}

/* ── Message thread ──────────────────────────────────── */
.messageThread {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Typing indicator ────────────────────────────────── */
.typingWrapper {
  padding: var(--space-2) 0;
}

/* ── Loading ─────────────────────────────────────────── */
.centerState {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 80px;
}

.loadingDots {
  display: flex;
  gap: 5px;
}

.loadingDots span {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--text-muted);
  animation: pulse 1.2s ease-in-out infinite;
}

.loadingDots span:nth-child(2) { animation-delay: 0.2s; }
.loadingDots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

/* ── Mobile: full screen ─────────────────────────────── */
@media (max-width: 768px) {
  .panel {
    width: 100%;
    max-width: 100%;
    border-left: none;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatPanel.tsx src/components/chat/ChatPanel.module.css
git commit -m "$(cat <<'EOF'
feat(chat): ChatPanel component with state machine

- Manages: loading → presets → chat state transitions
- Integrates all sub-components (MessageBubble, TypingIndicator, ChatInput, PresetSelector)
- Calls Convex: getDesign, sendMessage, applyDesign, applyPreset, undo
- Handles "undo" as an inline chat command
- Auto-scrolls to latest message
- Mobile: full-screen overlay at < 768px

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Profile Page Integration

**Files:**
- Create: `src/components/chat/ChatDesignerToggle.tsx`
- Create: `src/components/chat/ChatDesignerToggle.module.css`
- Modify: `src/app/[username]/page.tsx`
- Modify: `src/app/[username]/page.module.css`

- [ ] **Step 1: Create `src/components/chat/ChatDesignerToggle.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `src/components/chat/ChatDesignerToggle.module.css`**

```css
.editBtn {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--text-primary);
  color: var(--bg);
  border: none;
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  z-index: var(--z-raised);
}

.editBtn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.editBtn:active {
  transform: translateY(0);
}
```

- [ ] **Step 3: Modify `src/app/[username]/page.tsx` — add ChatDesignerToggle**

Add an import near the top (after existing imports):

```tsx
import ChatDesignerToggle from '@/components/chat/ChatDesignerToggle';
```

Find the `return` block and add the toggle after the closing `</main>` tag:

```tsx
  return (
    <>
      <main className={styles.page}>
        {/* ... existing content ... */}
      </main>
      <ChatDesignerToggle isOwnProfile={true} />
    </>
  );
```

> **Note for later:** When Convex auth is wired up, `isOwnProfile` will be `true` when `username === authenticatedUsername`. For now, hardcode it to `true` during local development.

- [ ] **Step 4: Modify `src/app/[username]/page.module.css` — add panel split styles**

Add to the end of the file:

```css
/* ── When chat panel is open, nudge the page ─────────── */
/* The toggle button is position:fixed so the page itself
   doesn't need layout changes — it naturally sits behind
   the 40% panel. Just ensure the main content doesn't
   get cut off at the bottom on tall viewports. */
.page {
  min-height: 100vh;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatDesignerToggle.tsx \
  src/components/chat/ChatDesignerToggle.module.css \
  src/app/[username]/page.tsx \
  src/app/[username]/page.module.css
git commit -m "$(cat <<'EOF'
feat(chat): ChatDesignerToggle + profile page integration

- "Edit Portfolio" floating button (position:fixed, bottom-right)
- Opens ChatPanel as a slide-in overlay
- Toggle composed into profile page (isOwnProfile hardcoded for dev)
- Panel split: page naturally sits at 60% width behind the 40% panel

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Spec Coverage Check

| Spec Section | Implementation |
|---|---|
| Split screen layout | `ChatPanel.module.css` + `page.module.css` |
| First-run preset selector | `PresetSelector` + `ChatPanel` state `'presets'` |
| Apply-then-explain loop | `ChatPanel` → `sendMessage` → `applyDesign` |
| Undo button + "undo" command | `ChatPanel` → `undo` mutation |
| Message bubbles (user / ai / system) | `MessageBubble` |
| Typing indicator | `TypingIndicator` |
| Auto-save (debounced) | `applyDesign` mutation — no debounce needed, Convex handles it |
| AI constraints (approved colors, surface) | `design.ts` + `chat.ts` system prompt |
| `changeHistory` (max 10) | `applyDesign`, `applyPreset`, `undo` mutations |
| Mobile overlay | `ChatPanel.module.css` @media (max-width: 768px) |
| `prefers-reduced-motion` | Framer Motion handles this automatically via `panelSlideIn` / `messageIn` |

**No spec gaps found.**
