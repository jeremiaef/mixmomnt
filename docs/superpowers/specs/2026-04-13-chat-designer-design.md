# Chat Designer — Design Specification

**Date:** 2026-04-13
**Status:** Draft for review

---

## 1. Problem & Vision

The Chat Designer is what makes mixmomnt different from every other portfolio tool. Rather than a settings panel or drag-and-drop editor, the vibecoder talks to an AI in natural language and watches their portfolio update in real time. The experience should feel like collaborating with a designer who already knows the codebase — fast, fluid, and low-friction.

The core loop: vibecoder types a request → AI applies changes → preview updates live → vibecoder approves or refines.

---

## 2. Layout

### Screen Split (50/50)

The screen divides into two equal panes:

- **Left — Profile Preview (60% width):** The vibecoder's portfolio rendered in a scrollable iframe-like container. Changes from the chat apply here in real time. The preview is always fully visible — never covered by the chat panel.

- **Right — Chat Panel (40% width):** Conversation thread, input field, and controls. Fixed width, full height, scrollable history.

A vertical 1px divider separates the two panes.

### Panel Structure (right pane)

Top to bottom:
1. **Header bar** — "Chat Designer" label + close button (×)
2. **Message thread** — scrollable, latest at bottom
3. **Status indicator** — shows AI thinking state when processing
4. **Input area** — text input + send button

### Responsive Behavior

- **Mobile (< 768px):** Chat panel slides in from the bottom as a bottom sheet (60vh), profile becomes the full-width background. Dismissible by swipe-down or × button.
- **Tablet:** Reduced split (profile 55% / chat 45%).
- **Desktop:** Full 50/50 split.

---

## 3. Preset Flow

### Onboarding Sequence

1. Vibecoder signs in and connects GitHub.
2. System generates the auto-draft from GitHub repos (top repos, suggested tagline from README content, a baseline layout preset applied).
3. Vibecoder lands on their profile page with the draft applied.
4. If the draft "feels right" — they start editing in chat immediately.
5. If the draft "feels off" — a subtle prompt appears: "Not quite right? Pick a preset to start fresh."

### Preset Selector

Three visual preset cards shown in a horizontal scroll or grid:

- **Clean Dev** — minimal, code-adjacent, tight spacing
- **Bold Maker** — larger type, warmer, more expressive
- **Dark Experimental** — high contrast, maximal motion, sharp edges

Clicking a preset re-skins the current profile with that style, replacing the auto-draft. Chat editing continues from there.

### Why Not Preset-First?

Asking a vibecoder to pick a visual style before seeing any content forces them to make a decision with no reference point. The GitHub auto-draft gives them something real to react to — which is far more useful context than a label like "Bold Maker."

---

## 4. Conversation Flow

### Message Types

**User message** — right-aligned, dark surface background, light text.

**AI message** — left-aligned, slightly lighter surface, includes avatar initial (✦). Supports inline markdown.

**System message** — centered, muted text, no bubble. Used for "Design applied", "Preset changed", "No changes needed".

### Input Locking

While the AI is processing a request:
- The input field is locked (disabled, not hidden).
- A "Thinking..." indicator replaces the send button, with a sub-label showing what's happening: "tuning tagline...", "updating card layout...", "applying preset...".
- The conversation thread remains fully visible and scrollable.

### When Processing Completes

- Input re-enables.
- If changes were applied: a system message "Applied" appears, preview updates.
- If no changes needed: "Nothing to change — your portfolio already has that."
- If an error occurred: "Couldn't do that — try rephrasing."

### Undo

The last change is always undoable via a subtle "Undo" text link that appears below the AI's response. Only one level of undo (last change only). After undo, chat can continue normally.

---

## 5. Preview Controls

### Live / Preview Toggle

A toggle in the chat panel header: **Live** / **Preview only**.

- **Live mode (default):** Changes from the AI apply immediately to the profile preview.
- **Preview only mode:** Changes are staged but not applied. A badge on the preview says "Previewing changes". A "Apply all" button appears in the panel.

The toggle is always visible in the panel header, not buried in settings.

### Why Not Auto-Apply Everything?

"Live by default" sounds frictionless, but creates anxiety — users feel in permanent draft mode with no safety net. The toggle gives both: a fast, fluid experience for confident users, and a "hold on" mode for indecisive moments without requiring explicit confirmation on every change.

---

## 6. What the Chat Can Change

### Editable Properties (via natural language)

- **Tagline** — short phrase below display name
- **Bio text** — free text in the bio card
- **Repo visibility** — show/hide specific repos from the grid
- **Accent color** — within the dark palette (no bright colors)
- **Card layout density** — compact vs. spacious
- **Social links** — which links to display and their order
- **Project order** — which repos appear first
- **OG title and description**

### Not Editable via Chat

- Pixel-level positioning or sizing
- Individual animation timing
- Custom code or HTML injection

### Rollback

If a change produces an error or unexpected result, the system rolls back to the last known good state and shows: "That didn't work — reverted to your last design."

---

## 7. First Draft Generation

When a new vibecoder signs in, the system:
1. Fetches their public GitHub repos (sorted by last push).
2. Picks top 3 repos as the initial grid.
3. Suggests a tagline from README content (first line of README, cleaned).
4. Sets language tags from repo metadata.
5. Applies a baseline "Clean Dev" style as the starting point.

The vibecoder sees their real work in their real portfolio immediately — not a blank slate.

---

## 8. Component Inventory

### ChatPanel
- Full-height right pane, fixed width
- Contains: Header, MessageThread, StatusIndicator, ChatInput
- Manages conversation state (messages[], isProcessing, previewMode)

### MessageThread
- Scrollable list of messages
- Auto-scrolls to bottom on new message
- Stagger-reveal animation on new AI messages (fade + slide up, 200ms)

### ChatMessage
- Variant: user | ai | system
- AI messages show avatar initial (✦)
- Supports inline markdown rendering
- Undo link appears below AI responses (appears for 30 seconds after response)

### StatusIndicator
- Shown when isProcessing = true
- Replace send button with animated "..." dots
- Sub-label: "tuning tagline...", "updating card layout..."

### ChatInput
- Textarea (auto-grows up to 3 lines)
- Submit on Enter (Shift+Enter for newline)
- Disabled + placeholder when processing
- Send button (arrow icon) disabled when empty

### PresetSelector
- Horizontal card layout
- Visual preview on each card (simplified portfolio thumbnail)
- Label + short description per preset
- "Skip" option to continue with auto-draft

### PreviewToggle
- In panel header: "Live" | "Preview only"
- Pill-style toggle with visual indicator of current mode

---

## 9. Technical Approach

### Frontend
- React with `useReducer` for conversation state machine
- Framer Motion for message entrance animations
- CSS Modules for all panel styling
- No external chat/AI SDK — AI via Convex server actions calling Claude API

### Backend (Convex Server Actions)
- `chat.sendMessage` — receives user message, calls Claude API, returns design patch
- `chat.applyDesign` — persists a design patch to the user's `profileDesign` table
- `chat.generateFirstDraft` — triggered on first login, runs the GitHub fetch + draft generation
- `chat.undoLastChange` — reverts to the previous designJson state

### Design State
- `profileDesign.designJson` is a JSON blob: `{ colors, layout, motion, repoVisibility[], socialOrder[] }`
- On each design patch, the previous state is snapshot'd for undo before the new state is applied
- All changes auto-save — no explicit save button

### AI Prompting
- System prompt: role = "mixmomnt design assistant", knowledge = full design spec, constraint = "only edit the properties listed in the editable properties section"
- Conversation history passed in full (up to last 20 messages)
- Response format: `{ changes: DesignPatch, explanation: string }`
- DesignPatch schema validated before applying

---

## 10. Open Questions

- **Max message history:** How far back does the AI remember? 20 messages seems reasonable — too far and costs + latency grow, too short and context is lost. Flagged for user decision.
- **Rate limiting:** If a user sends rapid messages while input is unlocked (after processing), should we queue or drop duplicates? Suggested: queue with max depth of 1 (drop if one is pending).
- **Preset thumbnails:** Should preset cards show real thumbnail previews or simplified wireframes? Wireframes are cheaper and sufficient — real thumbnails require rendering pipeline.

---

*Design confirmed with user. Implementation plan to follow.*