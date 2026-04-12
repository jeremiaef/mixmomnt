import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const GitHubApiBase = "https://api.github.com";

export const fetchRepos = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Retrieve the stored GitHub OAuth token from authAccounts
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "github")
      )
      .first();

    if (!account || !account.secret) {
      throw new Error("No GitHub account linked");
    }

    const token = account.secret;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const username = identity.nickname as string | undefined;
    if (!username) {
      throw new Error("No GitHub username found in identity");
    }

    const response = await fetch(
      `${GitHubApiBase}/users/${username}/repos?sort=pushed&per_page=30`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "mixmomnt-portfolio",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = (await response.json()) as GitHubRepo[];

    return repos.map((repo) => ({
      repoName: repo.name,
      repoFullName: repo.full_name,
      description: repo.description || "",
      liveUrl: repo.homepage || "",
      language: repo.language || "",
      lastCommitDate: repo.pushed_at ? new Date(repo.pushed_at).getTime() : null,
    }));
  },
});

export const fetchReadme = mutation({
  args: { repoFullName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "github")
      )
      .first();

    if (!account || !account.secret) {
      throw new Error("No GitHub account linked");
    }

    const token = account.secret;

    const response = await fetch(
      `${GitHubApiBase}/repos/${args.repoFullName}/readme`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "mixmomnt-portfolio",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { content?: string };
    if (!data.content) {
      return null;
    }

    // README content is base64-encoded with newlines stripped
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
      "utf-8"
    );
  },
});

export const getProfile = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      return null;
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isHidden"), false))
      .collect();

    const profileDesign = await ctx.db
      .query("profileDesign")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return {
      user,
      projects,
      profileDesign,
    };
  },
});

// --- Types ---

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  pushed_at: string | null;
}