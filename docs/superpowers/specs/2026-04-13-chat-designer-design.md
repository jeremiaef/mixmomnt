# Chat Designer — Design Specification

**Date:** 2026-04-13
**Status:** Approved

---

## 1. Overview

The Chat Designer is how vibecoders customize their portfolio page without writing code. It lives alongside the live profile as a split-screen panel, making the editing experience immediate and reversible.

**Key principles:**
- Changes are visible in real-time — no mode switching, no preview pages
- Every change is reversible — undo is always one tap or one word away
- The AI is constrained to a clear surface — it cannot touch things outside its domain
- First-time users start from a chosen preset, not a blank canvas

---

## 2. Layout

### Split Screen

When the Chat Designer is active:
- **Left (60%):** Profile page — fully interactive, updates live as changes are made
- **Right (40%):** Chat panel — conversation history, input, controls

The profile cards reflow from 3 columns to 2 columns to accommodate the narrower preview. This is acceptable — the vibecoder can still read every card.

An "Edit Portfolio" button is visible on the profile page when the vibecoder is authenticated and viewing their own page. Clicking it opens the split-screen layout. A close button (×) collapses the panel and returns to full-profile view.

The panel animates in from the right (slide + fade, ~250ms ease-out).

### Mobile

On screens below 768px, the chat panel takes the full screen when opened (overlay). Profile is not visible alongside the panel on mobile.

---

## 3. First-Run Flow

On first login (when no `profileDesign` record exists yet):

1. Vibecoder lands on their profile page with an "Edit Portfolio" prompt
2. Clicking "Edit Portfolio" opens the **Preset Selector** (not the chat)
3. Three presets shown as visual thumbnail cards:

| Preset | Vibe | Typography | Accent |
|--------|------|------------|--------|
| **Clean Dev** | Minimal, code-adjacent | System UI, tight | Neutral gray |
| **Bold Maker** | Expressive, warmer | Larger type, generous spacing | Warm off-white |
| **Dark Experimental** | High contrast, motion-forward | Standard | Near-black with bright accent |

4. Each thumbnail shows a live mini-preview of how the profile would look
5. One click applies the preset and opens the chat
6. No wizard — one step, then done

**Presets available anytime:** After initial setup, the vibecoder can say "show me other styles" in chat or access a settings menu to revisit presets.

---

## 4. Chat Interface

### Message Bubbles

- **User messages:** Right-aligned, surface-raised background, primary text color
- **AI messages:** Left-aligned, slightly darker surface, secondary text color. Includes an **Undo** button on each AI message.
- **System messages** (e.g., "Applied: tagline updated to '…'"): Left-aligned, muted style, no Undo

### Typing Indicator

While the AI is generating a response, show a three-dot pulse animation. Messages fade in from the bottom as they arrive.

### Input

- Text input at the bottom of the panel
- Send button (or Enter key)
- Keyboard accessible
- Input clears on send

### Empty State

When no conversation exists yet (preset applied, chat open, no history): show a prompt suggesting what to try, e.g.

> "Try: 'make it more minimal', 'add my Twitter', or 'change the accent to blue'"

---

## 5. AI Editing Loop

### Apply-Then-Explain

When the vibecoder sends a message like *"make it more minimal"*:

1. The AI parses the intent
2. It applies the change immediately to the profile preview (left side)
3. It sends an explanation message: "Done. I've simplified the layout — you now have a 2-column grid with cleaner card spacing."
4. The change auto-saves to Convex (`profileDesign` table)

No confirmation step before applying. The Undo button is always available if something goes wrong.

### Undo

Each AI message has an **Undo** button. Clicking it:
- Reverts the most recent change (restores previous `designJson`)
- Adds a system message: "Undone — reverted to previous state"
- Chirality: user can also type "undo" in chat and get the same result

Undo history stores the last 10 states in Convex (`profileDesign.changeHistory`).

### What the AI Can Change

Hardcoded in the system prompt:

| Property | Examples |
|----------|----------|
| Tagline | "building things that feel alive" |
| Bio text | Free-text description |
| Accent colors | Within the approved dark palette |
| Card layout density | 2-col, 3-col, tighter spacing |
| Repo visibility | Show/hide specific repos |
| Social links | Add/remove GitHub, Twitter, email |
| OG title + description | What shows when shared on X |

**What the AI cannot change:** Individual pixel layout, custom CSS, arbitrary fonts, colors outside the approved palette, anything not in this list.

If the user asks for something outside the allowed surface, the AI responds politely declining and suggests something in-bounds:

> "I can adjust the tagline, bio, colors, and which projects show — but I can't change individual layout details like card order or font sizes. Want me to adjust one of those instead?"

---

## 6. AI Constraints Architecture

**Combination approach.** System prompt defines the structural constraints — what the AI is and isn't allowed to do, how to interpret commands, and the tone of responses.

**Convex field** (`profileDesign.designJson`) stores the current page state — current values of all editable properties. This is passed to the AI on every message so it always has accurate context about what the page looks like right now.

**Data flow per message:**
```
User message → Convex action → system prompt (with current designJson) →
Claude API → response + updated designJson → save to Convex → profile updates
```

---

## 7. Data Model

### `profileDesign` additions

```typescript
// Existing fields (Phase 1)
designJson: string  // serialized DesignState
chatHistory: string  // serialized conversation messages

// New fields (Phase 2)
changeHistory: string[]  // array of prior designJson snapshots (max 10)
lastChangeAt: number      // timestamp of last change
presetId: string | null // which preset is currently applied
```

### `designJson` shape

```typescript
interface DesignState {
  tagline: string;
  bio: string;
  accentColor: string;       // hex, within approved palette
  layoutDensity: 'compact' | 'normal' | 'spacious';
  visibleRepoIds: string[];  // which repos to show
  socialLinks: {
    github?: string;
    twitter?: string;
    email?: string;
  };
  ogTitle: string;
  ogDescription: string;
}
```

---

## 8. Components

### `ChatPanel`
- Slide-in panel, fixed to right 40% of screen
- Manages conversation state, AI API calls, auto-save

### `MessageBubble`
- Renders user / AI / system message variants
- AI variant includes Undo button

### `TypingIndicator`
- Three-dot pulse, shown while AI is responding

### `PresetSelector`
- Shown on first run, before chat opens
- Three thumbnail cards with live mini-previews
- Single-click applies and transitions to chat

### `ChatInput`
- Text input with send button
- Keyboard accessible (Enter to send)
- Clears on send, disabled while AI is typing

### `ChatDesignerToggle`
- "Edit Portfolio" button on profile page (authenticated, own page only)
- Collapses/expands the split-screen layout

---

## 9. Technical Notes

- **No streaming yet:** AI responses arrive as complete messages (no token-by-token streaming in v1). Typing indicator shown while waiting.
- **Debounced auto-save:** `designJson` saves to Convex with a 500ms debounce to avoid excessive writes during rapid changes.
- **Error handling:** If the AI call fails, show an error message in chat ("Sorry, something went wrong. Try again.") and retain the user's last message.
- **Reduced motion:** All panel animations respect `prefers-reduced-motion`.
- **Mobile:** On screens below 768px, the chat panel takes the full screen when opened (overlays the profile). Profile is not visible in split while panel is open on mobile.
