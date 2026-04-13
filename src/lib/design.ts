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