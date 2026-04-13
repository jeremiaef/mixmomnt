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
  type ChatMessage,
  PRESETS,
} from "../src/lib/design";

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

    const chatHistory = profileDesign.chatHistory
      ? (JSON.parse(profileDesign.chatHistory) as ChatMessage[])
      : [];

    return {
      designJson: profileDesign.designJson,
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

    const preset = PRESETS.find((p) => p.id === args.presetId);
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

    const changeHistory = (existing?.changeHistory ?? []);
    changeHistory.unshift(
      existing?.designJson ?? serializeDesign(DEFAULT_DESIGN_STATE)
    );
    if (changeHistory.length > 10) changeHistory.pop();

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

// ─── sendMessage ─────────────────────────────────────────────────────────────

export const sendMessage = action({
  args: {
    message: v.string(),
    designJson: v.string(),
    chatHistory: v.array(
      v.object({
        id: v.string(),
        role: v.union(
          v.literal("user"),
          v.literal("ai"),
          v.literal("system")
        ),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("CLAUDE_API_KEY not set");

    const recentHistory = args.chatHistory.slice(-20).map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));

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
        messages: [...recentHistory, { role: "user", content: args.message }],
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
        // Not JSON — use whole response as explanation
      }
    }

    // Validate accent color against approved list
    try {
      const { APPROVED_ACCENT_COLORS } = await import("../src/lib/design");
      if (
        patch.accentColor &&
        !APPROVED_ACCENT_COLORS.includes(patch.accentColor)
      ) {
        patch.accentColor = deserializeDesign(args.designJson).accentColor;
      }
    } catch {
      // If import fails, skip validation
    }

    const userMessageId = `user-${Date.now()}`;
    const aiMessageId = `ai-${Date.now()}`;

    return { userMessageId, aiMessageId, explanation, patch };
  },
});

// ─── applyDesign ─────────────────────────────────────────────────────────────

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
        role: v.union(
          v.literal("user"),
          v.literal("ai"),
          v.literal("system")
        ),
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

    const changeHistory = (existing?.changeHistory ?? []);
    changeHistory.unshift(
      existing?.designJson ?? serializeDesign(DEFAULT_DESIGN_STATE)
    );
    if (changeHistory.length > 10) changeHistory.pop();

    const newDesign = applyDesignPatch(currentDesign, args.patch);

    const lastUserMsg = args.chatHistory
      .filter((m) => m.role === "user")
      .pop();
    const updatedHistory: ChatMessage[] = [
      ...args.chatHistory.slice(-18),
      {
        id: args.userMessageId,
        role: "user",
        content: lastUserMsg?.content ?? "",
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

    await ctx.db.patch(existing._id, {
      designJson: previousJson,
      changeHistory: restHistory,
      lastChangeAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { ok: true, designJson: previousJson };
  },
});