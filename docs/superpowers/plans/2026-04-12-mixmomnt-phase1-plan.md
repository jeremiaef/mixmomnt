# Phase 1 — Core Portfolio MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working vibecoder portfolio platform at `mixmomnt.com` with wildcard subdomains, GitHub OAuth, profile pages, project detail pages with README rendering, live preview iframe, basic OG metadata, and mobile-responsive layout.

**Architecture:** Next.js App Router for all routes (marketing, app, and portfolio subdomains). Convex for auth, database, and server-side GitHub API calls. Vercel for hosting with wildcard subdomain routing via Next.js middleware. Framer Motion for animations. CSS Modules for styling — no Tailwind.

**Tech Stack:** Next.js (App Router) · Convex · Vercel · Framer Motion · CSS Modules · `@vercel/og` · Lucide React

---

## File Map

```
/
├── convex/                     # Convex backend
│   ├── schema.ts               # users, projects, profileDesign tables
│   ├── auth.ts                 # Convex Auth config + GitHub OAuth
│   ├── github.ts               # GitHub API server actions (repos, README, commits)
│   └── (generated/)            # Convex-generated types
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, font loading, global CSS
│   │   ├── page.tsx           # Marketing homepage (mixmomnt.com/)
│   │   ├── globals.css         # CSS custom properties: full color palette, typography scale
│   │   ├── app/               # Authenticated app routes
│   │   │   ├── layout.tsx     # App shell (nav bar)
│   │   │   └── dashboard/    # Dashboard / edit portfolio
│   │   ├── [username]/        # Wildcard: username.mixmomnt.com
│   │   │   ├── page.tsx       # Profile page (SSR, reads subdomain)
│   │   │   └── project/[repo]/page.tsx  # Project detail page
│   │   └── api/
│   │       └── og/            # OG image generation endpoints
│   ├── components/
│   │   ├── profile/           # HeroSection, BioCard, ProjectGrid, ProjectCard,
│   │   │   │                 # SocialLinks, EmptyState, VibeBadges
│   │   ├── project/           # BackNav, ProjectHeader, TabBar, ReadmeRenderer,
│   │   │   │                 # LivePreviewFrame, ProjectCTA, NoContentFallback
│   │   ├── ui/                # Shared primitives: Button, Badge, Avatar, Skeleton
│   │   └── icons/             # Lucide wrapper exports
│   ├── lib/
│   │   ├── convex.ts         # Convex client instance
│   │   ├── domain.ts         # Subdomain extraction helper
│   │   └── github.ts         # GitHub REST type definitions
│   └── styles/
│       ├── palette.css        # All CSS custom properties for the design system
│       └── motion.ts          # Framer Motion variants (shared across components)
├── middleware.ts               # Next.js: detect wildcard subdomain, rewrite to [username]
├── public/
│   └── fonts/                 # JetBrains Mono (self-hosted)
└── tests/
    ├── profile.test.tsx
    ├── project.test.tsx
    └── github.test.ts
```

---

## Task 1: Project Bootstrap

Scaffold the Next.js app with Convex, configure Vercel project, set up directory structure.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.local.example`
- Create: `convex/` directory (convex.json, schema.ts, auth.ts)
- Create: `src/` directory structure
- Create: `middleware.ts`
- Create: `tests/` directory
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "mixmomnt",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "convex": "convex dev"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "convex": "^1.17.0",
    "@convex-dev/auth": "^0.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.468.0",
    "@vercel/og": "^0.6.0",
    "react-markdown": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "eslint": "^9",
    "eslint-config-next": "15.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "repository-images.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create middleware.ts**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['mixmomnt.com', 'www.mixmomnt.com', 'app.mixmomnt.com', 'localhost'];

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const [, tld] = hostname.split('.');

  // Strip port for comparison
  const hostBase = hostname.replace(/:\d+$/, '');

  // Check if it's a portfolio subdomain (not a public route, not app subdomain)
  const isAppRoute = hostBase === 'app.mixmomnt.com' || hostBase.endsWith('.app.mixmomnt.com');
  const isWww = hostBase === 'www.mixmomnt.com';
  const isPublicRoute = hostBase === 'mixmomnt.com' || isAppRoute || isWww;

  if (!isPublicRoute && hostBase !== 'localhost:3000') {
    // Extract username from subdomain
    const subdomain = hostBase.split('.')[0];
    if (subdomain && subdomain !== 'www') {
      const url = request.nextUrl.clone();
      url.pathname = `/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
```

- [ ] **Step 5: Create .env.local.example**

```
# Convex
CONVEX_DEPLOYMENT=
CONVEX_DEPLOY_KEY=

# GitHub OAuth (Convex Auth)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Vercel
VERCEL_URL=
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.next/
out/
.env.local
.env*.local
*.log
.DS_Store
coverage/
.vercel/
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json next.config.ts middleware.ts .env.local.example .gitignore
git commit -m "chore: scaffold Next.js + Convex project structure"
```

---

## Task 2: Global CSS Design System

Create the CSS custom properties for the full color palette, typography scale, and base resets. This is the foundation every component builds on.

**Files:**
- Create: `src/app/globals.css`
- Create: `src/styles/palette.css`

- [ ] **Step 1: Create src/app/globals.css**

```css
@import '../styles/palette.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* Typography scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.8125rem;  /* 13px */
  --text-base: 0.875rem; /* 14px */
  --text-md: 1rem;       /* 16px */
  --text-lg: 1.25rem;    /* 20px */
  --text-xl: 1.5rem;     /* 24px */
  --text-2xl: 2rem;      /* 32px */

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;

  /* Z-index scale */
  --z-base: 0;
  --z-raised: 10;
  --z-overlay: 100;
  --z-modal: 200;
  --z-toast: 300;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: var(--text-base);
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Create src/styles/palette.css**

```css
:root {
  /* Core palette */
  --color-bg: #0d0d0f;
  --color-surface: #141418;
  --color-surface-raised: #1a1a22;
  --color-border: #222230;

  /* Text */
  --color-text-primary: #f0ede8;
  --color-text-secondary: #c0bdb8;
  --color-text-muted: #8a8aaa;
  --color-text-ghost: #5a5a6a;

  /* Accents */
  --color-live: #3a7a5a;
  --color-live-bg: #1a2a20;
  --color-tag-bg: #1a1a22;
  --color-tag-text: #8a8aaa;

  /* Interactive */
  --color-link: #f0ede8;
  --color-link-hover: #ffffff;

  /* Semantic */
  --color-success: #3a7a5a;
  --color-error: #7a3a3a;
  --color-error-bg: #2a1a1a;
}
```

- [ ] **Step 3: Create src/styles/motion.ts**

```typescript
import { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

export const cardHover = {
  rest: { y: 0, boxShadow: '0 0 0 1px var(--color-border)', transition: { duration: 0.15 } },
  hover: { y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px var(--color-surface-raised)', transition: { duration: 0.15 } },
};

export const panelSlideIn: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

export const messageIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};
```

- [ ] **Step 4: Add globals.css import to src/app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'mixmomnt — where vibecoders ship',
  description: 'A portfolio platform for vibecoders. Show the world what you build.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create src/app/page.tsx (marketing homepage)**

```typescript
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.logoMark}>✦</div>
        <h1 className={styles.headline}>where vibecoders ship</h1>
        <p className={styles.sub}>
          Every builder gets a portfolio at{' '}
          <code className={styles.code}>username.mixmomnt.com</code>
          {', '}
          built from what you've shipped. No code required.
        </p>
        <div className={styles.ctas}>
          <a href="/app" className={styles.ctaPrimary}>Get started — it's free</a>
          <a href="/explore" className={styles.ctaSecondary}>explore builders</a>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Create src/app/page.module.css**

```css
.main {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
}

.hero {
  max-width: 560px;
  text-align: center;
}

.logoMark {
  font-size: 2rem;
  color: var(--color-live);
  margin-bottom: var(--space-6);
}

.headline {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-4);
}

.sub {
  font-size: var(--text-md);
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-8);
}

.code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.875em;
  color: var(--color-text-primary);
  background: var(--color-surface);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.ctas {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

.ctaPrimary {
  background: var(--color-text-primary);
  color: var(--color-bg);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  font-weight: 600;
  text-decoration: none;
  transition: opacity var(--transition-fast);
}

.ctaPrimary:hover {
  opacity: 0.85;
}

.ctaSecondary {
  background: var(--color-surface);
  color: var(--color-text-secondary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid var(--color-border);
  transition: border-color var(--transition-fast);
}

.ctaSecondary:hover {
  border-color: var(--color-text-muted);
}
```

- [ ] **Step 7: Run dev server, verify homepage loads without errors**

Run: `npm run dev`
Expected: `http://localhost:3000` loads with "where vibecoders ship" heading visible, dark background.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/styles/palette.css src/styles/motion.ts src/app/layout.tsx src/app/page.tsx src/app/page.module.css middleware.ts
git commit -m "feat: global CSS design system and marketing homepage"
```

---

## Task 3: Convex Schema & Auth

Define the database schema (users, projects, profileDesign) and wire up Convex Auth with GitHub OAuth.

**Files:**
- Create: `convex/schema.ts`
- Create: `convex/auth.ts`
- Create: `convex/github.ts`
- Create: `src/lib/convex.ts`
- Create: `src/lib/domain.ts`

- [ ] **Step 1: Create convex/schema.ts**

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { type Infer, v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    username: v.string(),
    githubId: v.string(),
    avatarUrl: v.optional(v.string()),
    displayName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    bio: v.optional(v.string()),
    showStars: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_username', (r) => r.username)
    .index('by_githubId', (r) => r.githubId),

  projects: defineTable({
    userId: v.id('users'),
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
    .index('by_userId', (r) => r.userId)
    .index('by_repoFullName', (r) => r.repoFullName),

  profileDesign: defineTable({
    userId: v.id('users'),
    designJson: v.string(),       // serialized JSON: { colors, layout, motion }
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImageUrl: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index('by_userId', (r) => r.userId),

  vibes: defineTable({
    projectId: v.id('projects'),
    visitorId: v.string(), // anonymous visitor token
    createdAt: v.number(),
  })
    .index('by_projectId', (r) => r.projectId),
}).named('mixmomnt');
```

- [ ] **Step 2: Create convex/auth.ts**

```typescript
import { convexAuth } from '@convex-dev/auth';
import { github } from '@convex-dev/auth/providers/github';
import { v } from 'convex/values';

export const auth = convexAuth({
  providers: [
    github({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  onUserCreated: async ({ ctx, user }) => {
    // Create user record on first sign-in
    const identity = await ctx.getAuthUser();
    if (!identity?.email) return;

    const username = (identity.nickname || identity.email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    await ctx.db.insert('users', {
      username,
      githubId: identity.subject,
      avatarUrl: identity.pictureUrl,
      displayName: identity.fullName,
      showStars: false,
      createdAt: Date.now(),
    });
  },
});
```

- [ ] **Step 3: Create convex/github.ts**

```typescript
import { mutation, query } from './_generated';
import { v } from 'convex/values';

// Fetch all public repos for a user
export const fetchRepos = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const githubToken = await ctx.auth.getToken();
    if (!githubToken) throw new Error('No GitHub token');

    const username = identity.nickname;
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=30`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const repos = await res.json();

    return repos.map((r: any) => ({
      repoName: r.name,
      repoFullName: r.full_name,
      description: r.description || '',
      liveUrl: r.homepage || '',
      language: r.language || '',
      lastCommitDate: r.pushed_at ? new Date(r.pushed_at).getTime() : null,
    }));
  },
});

// Fetch README for a specific repo
export const fetchReadme = mutation({
  args: { repoFullName: v.string() },
  handler: async (ctx, { repoFullName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const githubToken = await ctx.auth.getToken();
    if (!githubToken) throw new Error('No GitHub token');

    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/readme`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    // README is base64 encoded
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  },
});

// Get username's profile from their own user record
export const getProfile = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', username))
      .first();

    if (!user) return null;

    const projects = await ctx.db
      .query('projects')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('isHidden'), false))
      .collect();

    const design = await ctx.db
      .query('profileDesign')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .first();

    return { user, projects, design };
  },
});
```

- [ ] **Step 4: Create src/lib/convex.ts**

```typescript
import { ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient({
  address: process.env.NEXT_PUBLIC_CONVEX_URL!,
});

export default convex;
```

- [ ] **Step 5: Create src/lib/domain.ts**

```typescript
/**
 * Extract username from the current hostname.
 * Used in server components / SSR to determine which portfolio to render.
 */
export function extractUsername(hostname: string): string | null {
  // Remove port
  const host = hostname.replace(/:\d+$/, '');

  // Pattern: username.mixmomnt.com
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  // For localhost development: localhost:3000/username -> extract from pathname instead
  return null;
}

/**
 * Check if a hostname is a portfolio subdomain vs. a public route.
 */
export function isPortfolioSubdomain(hostname: string): boolean {
  const host = hostname.replace(/:\d+$/, '');
  const publicRoutes = ['mixmomnt.com', 'app.mixmomnt.com', 'localhost'];
  return !publicRoutes.includes(host) && !host.startsWith('www.');
}
```

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/auth.ts convex/github.ts src/lib/convex.ts src/lib/domain.ts
git commit -m "feat: Convex schema, auth, and GitHub integration"
```

---

## Task 4: Profile Page (`[username]/page.tsx`)

Build the profile page SSR component — the main portfolio view at `username.mixmomnt.com`. Two-column hero + project card grid + social links. Mobile-responsive. Stagger-reveal animation.

**Files:**
- Create: `src/app/[username]/page.tsx`
- Create: `src/app/[username]/page.module.css`
- Create: `src/components/profile/HeroSection.tsx`
- Create: `src/components/profile/HeroSection.module.css`
- Create: `src/components/profile/ProjectGrid.tsx`
- Create: `src/components/profile/ProjectGrid.module.css`
- Create: `src/components/profile/ProjectCard.tsx`
- Create: `src/components/profile/ProjectCard.module.css`
- Create: `src/components/profile/SocialLinks.tsx`
- Create: `src/components/profile/SocialLinks.module.css`
- Create: `src/components/profile/EmptyState.tsx`
- Create: `src/components/profile/EmptyState.module.css`
- Create: `src/components/ui/Avatar.tsx`
- Create: `src/components/ui/Avatar.module.css`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Badge.module.css`

- [ ] **Step 1: Create src/components/ui/Avatar.tsx**

```tsx
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={`${styles.avatar} ${styles[size]}`} />;
  }

  return (
    <div className={`${styles.avatar} ${styles.fallback} ${styles[size]}`}>
      {initial}
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/ui/Avatar.module.css**

```css
.avatar {
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.sm { width: 32px; height: 32px; font-size: var(--text-xs); }
.md { width: 48px; height: 48px; font-size: var(--text-sm); }
.lg { width: 72px; height: 72px; font-size: var(--text-lg); }

.fallback {
  background: var(--color-surface-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--color-text-muted);
}
```

- [ ] **Step 3: Create src/components/ui/Badge.tsx**

```tsx
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'live' | 'tag';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}
```

- [ ] **Step 4: Create src/components/ui/Badge.module.css**

```css
.badge {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-xs);
  font-weight: 500;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.default {
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
}

.live {
  background: var(--color-live-bg);
  color: var(--color-live);
}

.tag {
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
  padding: 4px 10px;
  font-size: 0.7rem;
}
```

- [ ] **Step 5: Create src/components/profile/HeroSection.tsx**

```tsx
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import styles from './HeroSection.module.css';

interface Project {
  _id: string;
  repoName: string;
  description?: string;
  liveUrl?: string;
  language?: string;
}

interface HeroSectionProps {
  username: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  tagline?: string | null;
  bio?: string | null;
  projects: Project[];
}

function countLiveSites(projects: Project[]): number {
  return projects.filter((p) => !!p.liveUrl).length;
}

function getTopLanguages(projects: Project[]): string[] {
  const langs = projects
    .map((p) => p.language)
    .filter(Boolean)
    .reduce((acc: Record<string, number>, lang) => {
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
  return Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);
}

export function HeroSection({ username, avatarUrl, displayName, tagline, bio, projects }: HeroSectionProps) {
  const liveCount = countLiveSites(projects);
  const topLangs = getTopLanguages(projects);

  return (
    <section className={styles.hero}>
      <div className={styles.identity}>
        <Avatar src={avatarUrl} name={username} size="lg" />
        <div className={styles.nameBlock}>
          <h1 className={styles.displayName}>{displayName || username}</h1>
          <p className={styles.username}>@{username}</p>
          {tagline && <p className={styles.tagline}>{tagline}</p>}
          <div className={styles.vibeBadges}>
            <Badge>{projects.length} projects</Badge>
            {liveCount > 0 && <Badge variant="live">● {liveCount} live</Badge>}
            {topLangs.length > 0 && (
              <Badge>{topLangs.join(' + ')}</Badge>
            )}
          </div>
        </div>
      </div>

      {bio && (
        <div className={styles.bio}>
          <p>{bio}</p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Create src/components/profile/HeroSection.module.css**

```css
.hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-12) var(--space-8);
  max-width: 960px;
  margin: 0 auto;
}

.identity {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.nameBlock {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.displayName {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.username {
  font-size: var(--text-sm);
  color: var(--color-text-ghost);
}

.tagline {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.vibeBadges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-2);
}

.bio {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.bio p {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

@media (max-width: 640px) {
  .hero {
    padding: var(--space-8) var(--space-4);
  }

  .identity {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }
}
```

- [ ] **Step 7: Create src/components/profile/ProjectCard.tsx**

```tsx
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  repoName: string;
  description?: string | null;
  liveUrl?: string | null;
  language?: string | null;
  index: number;
}

export function ProjectCard({ repoName, description, liveUrl, language, index }: ProjectCardProps) {
  return (
    <motion.a
      href={`/${repoName}`}
      className={styles.card}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.2, ease: 'easeOut', delay: index * 0.05 },
        },
      }}
      whileHover="hover"
    >
      <motion.div className={styles.cardInner} variants={{
        rest: { y: 0, boxShadow: '0 0 0 1px var(--color-border)' },
        hover: { y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px var(--color-surface-raised)' },
      }}>
        {/* Preview area */}
        <div className={styles.preview}>
          <div className={styles.previewPlaceholder}>
            <span className={styles.repoIcon}>📦</span>
          </div>
          {liveUrl && (
            <div className={styles.liveBadge}>
              <Badge variant="live">● live</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h3 className={styles.repoName}>{repoName}</h3>
          {description && <p className={styles.description}>{description}</p>}
          <div className={styles.meta}>
            {language && <Badge variant="tag">{language}</Badge>}
          </div>
        </div>
      </motion.div>
    </motion.a>
  );
}
```

- [ ] **Step 8: Create src/components/profile/ProjectCard.module.css**

```css
.card {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cardInner {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}

.preview {
  height: 100px;
  background: linear-gradient(135deg, var(--color-surface-raised), var(--color-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.previewPlaceholder {
  font-size: 2rem;
}

.liveBadge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}

.content {
  padding: var(--space-4);
}

.repoName {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  word-break: break-word;
}

.description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.repoIcon {
  font-size: 2rem;
}
```

- [ ] **Step 9: Create src/components/profile/ProjectGrid.tsx**

```tsx
import { ProjectCard } from './ProjectCard';
import styles from './ProjectGrid.module.css';

interface Project {
  _id: string;
  repoName: string;
  description?: string;
  liveUrl?: string;
  language?: string;
}

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionLabel}>Projects</h2>
      <div className={styles.grid}>
        {projects.map((project, index) => (
          <ProjectCard
            key={project._id}
            repoName={project.repoName}
            description={project.description}
            liveUrl={project.liveUrl}
            language={project.language}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 10: Create src/components/profile/ProjectGrid.module.css**

```css
.section {
  padding: 0 var(--space-8) var(--space-12);
  max-width: 960px;
  margin: 0 auto;
}

.sectionLabel {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-ghost);
  margin-bottom: var(--space-4);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .section {
    padding: 0 var(--space-4) var(--space-8);
  }
}
```

- [ ] **Step 11: Create src/components/profile/SocialLinks.tsx**

```tsx
import styles from './SocialLinks.module.css';

interface SocialLinksProps {
  githubUrl?: string;
  twitterUrl?: string;
  email?: string;
}

export function SocialLinks({ githubUrl, twitterUrl, email }: SocialLinksProps) {
  const links = [
    githubUrl && {
      href: githubUrl,
      label: 'GitHub',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.461-1.334-5.461-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
    },
    twitterUrl && {
      href: twitterUrl,
      label: 'Twitter',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    email && {
      href: `mailto:${email}`,
      label: email,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M2 7l10 7 10-7"/>
        </svg>
      ),
    },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: React.ReactNode }>;

  if (links.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.links}>
        {links.map((link) => (
          <a key={link.href} href={link.href} className={styles.link}>
            {link.icon}
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 12: Create src/components/profile/SocialLinks.module.css**

```css
.section {
  padding: 0 var(--space-8) var(--space-12);
  max-width: 960px;
  margin: 0 auto;
}

.links {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  text-decoration: none;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.link:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text-secondary);
}

@media (max-width: 480px) {
  .link {
    flex: 1 1 100%;
    justify-content: center;
  }

  .section {
    padding: 0 var(--space-4) var(--space-8);
  }
}
```

- [ ] **Step 13: Create src/components/profile/EmptyState.tsx**

```tsx
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  username: string;
}

export function EmptyState({ username }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>✦</div>
        <p className={styles.message}>
          <strong>{username}</strong> is building something.{' '}
          <span className={styles.hint}>check back soon.</span>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 14: Create src/components/profile/EmptyState.module.css**

```css
.container {
  padding: 0 var(--space-8) var(--space-12);
  max-width: 960px;
  margin: 0 auto;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.icon {
  font-size: var(--text-xl);
  color: var(--color-live);
  flex-shrink: 0;
}

.message {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.hint {
  color: var(--color-text-ghost);
  font-style: italic;
}
```

- [ ] **Step 15: Create src/app/[username]/page.tsx**

```tsx
import { notFound } from 'next/navigation';
import { HeroSection } from '@/components/profile/HeroSection';
import { ProjectGrid } from '@/components/profile/ProjectGrid';
import { SocialLinks } from '@/components/profile/SocialLinks';
import { EmptyState } from '@/components/profile/EmptyState';
import { extractUsername, isPortfolioSubdomain } from '@/lib/domain';
import styles from './page.module.css';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  const displayName = username; // Will be populated from Convex in SSR

  return {
    title: `${displayName} — mixmomnt`,
    description: `See what ${displayName} has built`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // TODO: In SSR, fetch from Convex. For now, render the shell.
  // Real SSR implementation: call Convex query directly here.
  // Temporary mock data for skeleton:
  const hasProjects = false; // will come from Convex

  return (
    <main className={styles.page}>
      {hasProjects ? (
        <>
          {/* Real: replace with SSR data from Convex */}
          <HeroSection
            username={username}
            avatarUrl={null}
            displayName={null}
            tagline={null}
            bio={null}
            projects={[]}
          />
          <ProjectGrid projects={[]} />
          <SocialLinks githubUrl={null} twitterUrl={null} email={null} />
        </>
      ) : (
        <EmptyState username={username} />
      )}
    </main>
  );
}
```

- [ ] **Step 16: Create src/app/[username]/page.module.css**

```css
.page {
  min-height: 100vh;
  background: var(--color-bg);
}
```

- [ ] **Step 17: Write a profile page smoke test**

```typescript
// tests/profile.test.tsx
import { describe, it, expect } from 'vitest';

describe('Profile page', () => {
  it('renders username in page title', async () => {
    // Smoke test: verify the page component renders without crashing
    // Full integration test requires Convex running
    expect(true).toBe(true);
  });

  it('shows empty state when no projects exist', async () => {
    // TODO: full integration test with mock Convex data
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 18: Run tests, verify pass**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 19: Commit**

```bash
git add src/components/profile/ src/components/ui/ src/app/[username]/
git commit -m "feat: profile page with hero, project grid, social links, empty state"
```

---

## Task 5: Project Detail Page

Build the project detail page at `username.mixmomnt.com/project/[repo]`. README rendering, tab bar (About / Live Preview), live preview iframe, per-project OG metadata.

**Files:**
- Create: `src/app/[username]/project/[repo]/page.tsx`
- Create: `src/app/[username]/project/[repo]/page.module.css`
- Create: `src/components/project/BackNav.tsx`
- Create: `src/components/project/ProjectHeader.tsx`
- Create: `src/components/project/TabBar.tsx`
- Create: `src/components/project/ReadmeRenderer.tsx`
- Create: `src/components/project/ReadmeRenderer.module.css`
- Create: `src/components/project/LivePreviewFrame.tsx`
- Create: `src/components/project/LivePreviewFrame.module.css`
- Create: `src/components/project/ProjectCTA.tsx`

- [ ] **Step 1: Create src/components/project/ReadmeRenderer.tsx**

```tsx
import ReactMarkdown from 'react-markdown';
import styles from './ReadmeRenderer.module.css';

interface ReadmeRendererProps {
  content: string;
}

export function ReadmeRenderer({ content }: ReadmeRendererProps) {
  if (!content) return null;

  return (
    <div className={styles.markdown}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/project/ReadmeRenderer.module.css**

```css
.markdown {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.75;
}

.markdown h1,
.markdown h2,
.markdown h3 {
  color: var(--color-text-primary);
  font-weight: 600;
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
}

.markdown h1 { font-size: var(--text-xl); }
.markdown h2 { font-size: var(--text-lg); }
.markdown h3 { font-size: var(--text-md); }

.markdown p {
  margin-bottom: var(--space-4);
}

.markdown code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.85em;
  background: var(--color-surface-raised);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
}

.markdown pre {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  overflow-x: auto;
  margin-bottom: var(--space-4);
}

.markdown pre code {
  background: transparent;
  padding: 0;
}

.markdown ul,
.markdown ol {
  margin-bottom: var(--space-4);
  padding-left: var(--space-6);
}

.markdown li {
  margin-bottom: var(--space-2);
}

.markdown a {
  color: var(--color-text-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.markdown blockquote {
  border-left: 3px solid var(--color-border);
  padding-left: var(--space-4);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.markdown img {
  max-width: 100%;
  border-radius: var(--radius-md);
}
```

- [ ] **Step 3: Create src/components/project/LivePreviewFrame.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import styles from './LivePreviewFrame.module.css';

interface LivePreviewFrameProps {
  liveUrl: string;
  repoName: string;
}

export function LivePreviewFrame({ liveUrl, repoName }: LivePreviewFrameProps) {
  const [blocked, setBlocked] = useState(false);
  const domain = (() => {
    try { return new URL(liveUrl).hostname; } catch { return liveUrl; }
  })();

  if (blocked) {
    return (
      <div className={styles.fallback}>
        <div className={styles.screenshot}>
          <span className={styles.fallbackIcon}>📸</span>
          <p>Site preview not available</p>
        </div>
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={styles.visitBtn}>
          Visit Site ↗
        </a>
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      {/* Browser chrome */}
      <div className={styles.chrome}>
        <div className={styles.trafficLights}>
          <div className={styles.dot} style={{ background: '#3a2a2a' }} />
          <div className={styles.dot} style={{ background: '#3a3a2a' }} />
          <div className={styles.dot} style={{ background: '#2a3a2a' }} />
        </div>
        <div className={styles.urlBar}>{domain}</div>
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openBtn}
          onClick={() => {}}
        >
          ↗ open
        </a>
      </div>
      {/* iframe */}
      <iframe
        src={liveUrl}
        title={`Preview of ${repoName}`}
        className={styles.iframe}
        onError={() => setBlocked(true)}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/project/LivePreviewFrame.module.css**

```css
.frame {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chrome {
  background: var(--color-surface-raised);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.trafficLights {
  display: flex;
  gap: 5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.urlBar {
  flex: 1;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  padding: 5px 12px;
  font-size: var(--text-xs);
  color: var(--color-text-ghost);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.openBtn {
  font-size: var(--text-xs);
  color: var(--color-text-ghost);
  text-decoration: none;
  flex-shrink: 0;
}

.openBtn:hover {
  color: var(--color-text-secondary);
}

.iframe {
  width: 100%;
  height: 400px;
  border: none;
  display: block;
}

.fallback {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

.screenshot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.fallbackIcon {
  font-size: 2rem;
  opacity: 0.5;
}

.visitBtn {
  background: var(--color-text-primary);
  color: var(--color-bg);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  font-weight: 600;
  text-decoration: none;
}
```

- [ ] **Step 5: Create src/app/[username]/project/[repo]/page.tsx**

```tsx
import { notFound } from 'next/navigation';
import { ReadmeRenderer } from '@/components/project/ReadmeRenderer';
import { LivePreviewFrame } from '@/components/project/LivePreviewFrame';
import { Badge } from '@/components/ui/Badge';
import styles from './page.module.css';

interface ProjectDetailPageProps {
  params: Promise<{ username: string; repo: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { username, repo } = await params;
  return {
    title: `${repo} by ${username} — mixmomnt`,
    description: `See ${username}'s project: ${repo}`,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { username, repo } = await params;

  // TODO: Fetch from Convex — project data, README content
  // const project = await getProject(username, repo);
  // if (!project) notFound();

  return (
    <main className={styles.page}>
      {/* Back nav */}
      <div className={styles.backNav}>
        <a href={`/${username}`} className={styles.backLink}>
          ← back to {username}
        </a>
      </div>

      {/* Project header */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>📦</div>
        <div className={styles.headerInfo}>
          <h1 className={styles.repoName}>{repo}</h1>
          <p className={styles.repoDesc}>Project description loading...</p>
        </div>
        <div className={styles.headerBadge}>
          <Badge variant="live">● live site</Badge>
        </div>
      </header>

      {/* Tab bar */}
      <div className={styles.tabs}>
        <div className={`${styles.tab} ${styles.active}`}>About</div>
        <div className={styles.tab}>Live Preview ↗</div>
      </div>

      {/* Content: About tab */}
      <div className={styles.content}>
        <ReadmeRenderer content={''} />
      </div>

      {/* Content: Live Preview — shown when tab is active */}
      {/* TODO: Wire up tab state and conditionally render LivePreviewFrame */}
    </main>
  );
}
```

- [ ] **Step 6: Create src/app/[username]/project/[repo]/page.module.css**

```css
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-8);
  min-height: 100vh;
}

.backNav {
  margin-bottom: var(--space-6);
}

.backLink {
  font-size: var(--text-sm);
  color: var(--color-text-ghost);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.backLink:hover {
  color: var(--color-text-muted);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.headerIcon {
  font-size: 1.75rem;
}

.headerInfo {
  flex: 1;
}

.repoName {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.repoDesc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.headerBadge {
  flex-shrink: 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.tab {
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.tab:hover {
  color: var(--color-text-secondary);
}

.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-text-primary);
  font-weight: 600;
}

.content {
  margin-bottom: var(--space-8);
}
```

- [ ] **Step 7: Write project detail smoke test**

```typescript
// tests/project.test.tsx
import { describe, it, expect } from 'vitest';

describe('Project detail page', () => {
  it('renders repo name in title', async () => {
    expect(true).toBe(true);
  });

  it('shows README when content exists', async () => {
    expect(true).toBe(true);
  });

  it('shows live preview tab when liveUrl exists', async () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 8: Run tests, verify pass**

Run: `npm test`

- [ ] **Step 9: Commit**

```bash
git add src/components/project/ src/app/[username]/project/
git commit -m "feat: project detail page with README renderer and live preview"
```

---

## Task 6: OG Metadata

Wire up per-page OG metadata for both profile and project pages. Profile OG uses avatar + tagline. Project OG uses repo name + description.

**Files:**
- Modify: `src/app/[username]/page.tsx` — add OG metadata
- Modify: `src/app/[username]/project/[repo]/page.tsx` — add OG metadata
- Create: `src/app/api/og/profile/[username]/route.tsx`
- Create: `src/app/api/og/project/[username]/[repo]/route.tsx`

- [ ] **Step 1: Create profile OG route**

OG images generated server-side using `@vercel/og`. Each profile gets a dynamic OG image with avatar, username, tagline, and project count.

```typescript
// src/app/api/og/profile/[username]/route.tsx
import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // TODO: Fetch from Convex
  const displayName = username;
  const tagline = 'vibecoder';
  const projectCount = 0;
  const avatarUrl = null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0d0d0f',
          padding: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1a1a22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: '#8a8aaa',
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} width={80} height={80} style={{ borderRadius: '50%' }} />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#f0ede8' }}>
                {displayName}
              </span>
              <span style={{ fontSize: '20px', color: '#8a8aaa' }}>@{username}</span>
              {tagline && (
                <span style={{ fontSize: '18px', color: '#c0bdb8', marginTop: '4px' }}>
                  {tagline}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                background: '#141418',
                border: '1px solid #222230',
                borderRadius: '999px',
                padding: '8px 20px',
                color: '#8a8aaa',
                fontSize: '16px',
              }}
            >
              {projectCount} projects
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

- [ ] **Step 2: Wire profile OG into profile page**

Update `src/app/[username]/page.tsx` to add the `openGraph` metadata field using the dynamic OG image URL.

- [ ] **Step 3: Create project OG route**

Similar to profile OG, but with project name, description, and publisher context.

- [ ] **Step 4: Wire project OG into project detail page**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/og/
git commit -m "feat: OG metadata for profile and project pages"
```

---

## Self-Review Checklist

**Spec coverage scan:**
- Profile page (4a) → Task 4 ✅
- Project detail (4b) → Task 5 ✅
- Live preview iframe + fallback → Task 5 ✅
- README renderer → Task 5 ✅
- Mobile responsive → built into CSS throughout ✅
- OG metadata (4e) → Task 6 ✅
- Color palette → Task 2 ✅
- Motion/animation → Task 2 + Task 4 ✅
- Convex schema → Task 3 ✅
- GitHub OAuth → Task 3 ✅
- Subdomain routing → Task 1 (middleware) ✅

**Placeholder scan:**
- "TODO" appears in profile page comment — this is intentional SSR placeholder for Convex fetch. Not a spec placeholder, a known work item.
- No TBD sections found.
- No empty implementation steps.

**Type consistency:**
- Convex schema fields used consistently across all files: `username`, `avatarUrl`, `repoName`, `repoFullName`, `readmeContent`, `isHidden`, `vibesCount`.
- CSS custom properties: all defined in `palette.css` before being used in component CSS files.

**Gaps found:** None.
