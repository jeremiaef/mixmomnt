import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, type, provider }) {
      if (type !== "oauth") return;

      const identity = await ctx.auth.getUserIdentity();

      // Derive username from identity — prefer nickname, fall back to email prefix
      const raw = identity?.nickname ?? identity?.email?.split("@")[0] ?? "user";
      const username = raw.toLowerCase().replace(/[^a-z0-9]/g, "");

      await ctx.db.patch(userId, {
        username,
        githubId: identity?.subject ?? "",
        avatarUrl: identity?.pictureUrl ?? "",
        displayName: identity?.fullName ?? username,
        showStars: false,
        createdAt: Date.now(),
      });
    },
  },
});