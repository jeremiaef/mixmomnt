import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Merge authTables (which includes authSessions, authAccounts, authRefreshTokens,
// authVerificationCodes) with our custom application tables.
// We override the `users` table to add app-specific fields alongside auth's fields.
export default defineSchema({
  ...authTables,

  users: defineTable({
    // Auth library fields (required by default createOrUpdateUser behavior):
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // App-specific fields:
    username: v.string(),
    githubId: v.string(),
    avatarUrl: v.optional(v.string()),
    displayName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    bio: v.optional(v.string()),
    showStars: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_githubId", ["githubId"]),

  projects: defineTable({
    userId: v.id("users"),
    repoName: v.string(),
    repoFullName: v.string(),
    description: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    language: v.optional(v.string()),
    readmeContent: v.optional(v.string()),
    lastCommitDate: v.optional(v.number()),
    isHidden: v.boolean(),
    vibesCount: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_repoFullName", ["repoFullName"]),

  profileDesign: defineTable({
    userId: v.id("users"),
    designJson: v.string(),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImageUrl: v.optional(v.string()),
    updatedAt: v.number(),
    changeHistory: v.array(v.string()),
    lastChangeAt: v.number(),
    presetId: v.optional(v.string()),
    chatHistory: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  vibes: defineTable({
    projectId: v.id("projects"),
    visitorId: v.string(),
    createdAt: v.number(),
  }).index("by_projectId", ["projectId"]),
});
