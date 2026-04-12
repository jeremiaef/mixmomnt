import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
  callbacks: {
    /**
     * afterUserCreatedOrUpdated runs after the auth library creates/updates
     * the user document with auth profile fields (name, email, image).
     *
     * Here we add our app-specific fields to the user document.
     *
     * For GitHub OAuth, we extract the username from the stored authAccounts
     * entry (providerAccountId = GitHub username) and patch the user record.
     */
    async afterUserCreatedOrUpdated(ctx, { userId, type, provider }) {
      if (type !== "oauth") return;

      // Get the GitHub username from the authAccounts entry
      const account = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", userId).eq("provider", "github")
        )
        .first();

      const username =
        (account?.providerAccountId as string | undefined) ??
        (await ctx.auth.getUserIdentity()).nickname ??
        "user";

      await ctx.db.patch(userId, {
        username,
        showStars: false,
        createdAt: Date.now(),
      });
    },
  },
});
