# mixmomnt — Design Specification

**Date:** 2026-04-12
**Status:** Draft for review

---

## 1. Problem & Vision

Vibecoders — people who build products by writing code with help from AI tools — get dismissed by software engineers as "not real developers." But what they've shipped is real, useful, and often impressive. There's nowhere to see that work aggregated in one place, in a way that's legible to anyone — including non-technical people.

**mixmomnt** fixes that. Every vibecoder gets a portfolio at `username.mixmomnt.com`. Visitors land there and immediately see what that person builds — not a GitHub profile that requires technical literacy to parse, but a curated, designed experience that communicates craft. The vibecoder customizes their page using a conversational chat designer. No code required.

The platform lives at `mixmomnt.com` with wildcard subdomain routing. Vibecoders sign in, connect their GitHub, and get an auto-generated first draft. They iterate on it by talking to the chat designer.

**Design aesthetic:** dark, technical, and intentional — not AI slop. Near-black backgrounds with warm off-white text. Subtle, purposeful motion. The vibecoder's work is the color in a sea of restraint.

---

## 2. Design Language

### Color Palette

| Role            | Value     | Usage                              |
|-----------------|-----------|------------------------------------|
| Background      | `#0d0d0f` | Page backgrounds                   |
| Surface         | `#141418` | Cards, panels, inputs             |
| Surface raised  | `#1a1a22` | Hover states, elevated elements   |
| Border          | `#222230` | Card borders, dividers            |
| Text primary    | `#f0ede8` | Headings, main content            |
| Text secondary  | `#c0bdb8` | Body text, descriptions            |
| Text muted      | `#8a8aaa` | Labels, timestamps                |
| Text ghost      | `#5a5a6a` | Placeholders, disabled states     |
| Accent live     | `#3a7a5a` | Live site badge, success states   |
| Accent bg live  | `#1a2a20` | Background for live badge         |
| Accent tag      | `#1a1a22` | Tag chips background              |

*(Full palette with semantic color tokens to be defined as components are built.)*

### Typography

- **Display/headings:** System UI stack with tight letter-spacing. No overused Google Fonts — the design earns its character through restraint and motion, not typeface uniqueness.
- **Body:** Same stack, lighter weight, generous line-height.
- **Code/monospace:** JetBrains Mono or system monospace for any inline code display.
- **Scale:** 12 / 13 / 14 / 16 / 20 / 24 / 32px — deliberate, not arbitrary.

### Motion

Motion is the main differentiator. Every animation has a purpose.

- **Entrance:** Cards fade + slide up staggered on scroll, ~200ms ease-out, 50ms delay between items
- **Hover:** Cards lift 4px with a shadow and border-color shift, ~150ms ease
- **Panel slide:** Chat panel slides in from right, ~250ms ease-out
- **Message transitions:** Chat messages fade in from bottom, ~200ms
- **Page transitions:** Subtle crossfade between profile and project detail, ~200ms
- **Reduced motion:** All animations respect `prefers-reduced-motion` — no motion when set

### Visual Assets

- **Icons:** Lucide React — clean, consistent stroke weight, MIT licensed
- **Avatars:** Vibecoder's GitHub avatar pulled on sign-in, rounded to circle
- **Project images:** Auto-screenshots from Vercel/Cloudflare Pages API where available; gradient placeholders otherwise
- **No emoji in UI chrome** — only emoji in content areas (project descriptions, avatar fallbacks)

---

## 3. Architecture

### Domain & Routing

- `mixmomnt.com` — main marketing / landing page
- `*.mixmomnt.com` — wildcard subdomain, each vibecoder's portfolio
- `app.mixmomnt.com` — authenticated app (sign in, dashboard, chat designer)
- Convex handles routing via wildcard subdomain detection

### Subdomain Flow

```
Visitor types alice.mixmomnt.com
  → Vercel/Next.js middleware detects wildcard subdomain
  → Passes username to Next.js route handler
  → Convex query looks up "alice" in users table
  → Returns alice's portfolio page data
  → Next.js renders the profile with OG metadata set from alice's profileDesign
```

### Data Model (Convex)

**users**
```
id           : Id
username     : string (unique, lowercase, url-safe)
githubId     : string
githubToken  : string (encrypted, OAuth token)
avatarUrl    : string
displayName  : string (optional, defaults to GitHub name)
tagline      : string (optional)
bio          : string (optional, short free text)
showStars    : boolean (default false)
createdAt    : number
```

**projects**
```
id             : Id
userId         : Id
repoName       : string
repoFullName   : string
description    : string (auto or manual)
liveUrl        : string (optional)
language       : string
readmeContent  : string (fetched and rendered)
lastCommitDate : number
isHidden       : boolean
vibesCount     : number (visitor upvotes, not GitHub stars)
```

**profileDesign**
```
id          : Id
userId      : Id
designJson  : string (serialized design state — colors, layout, motion prefs)
chatHistory : string (serialized Convex conversation history)
ogTitle     : string
ogDescription : string
ogImageUrl  : string (optional, AI-generated or uploaded)
updatedAt   : number
```

### GitHub Sync

- OAuth via GitHub Apps (not personal access token flow)
- On sign-in: fetch all public repos, pull README content, language, star count
- Background sync: webhooks or polling every 6 hours for repo updates
- Only repos the vibecoder explicitly adds or unhides show on their portfolio

---

## 4. Features & Interactions

### 4a. Visitor Experience — Profile Page (`username.mixmomnt.com`)

**Layout (desktop):** Two-column hero — avatar + name/tagline on left, bio + stats on right. Below that: a responsive project card grid (3 columns desktop, 2 tablet, 1 mobile). Social links at bottom.

**Layout (mobile):** Single column. Avatar/name at top, bio below, project cards stacked vertically, social links as full-width buttons.

**Motion:** Cards stagger-reveal on scroll. Hover lifts cards with shadow. Social links have subtle scale on hover.

**Empty state:** If the vibecoder has no projects yet, show a placeholder card: "alice is building something. check back soon." — no blank void.

**Vibe badges:** Display maker stats ("12 projects · 3 live sites · React + AI") as small pills. This is what a non-technical visitor can point to and say "this person ships."

---

### 4b. Visitor Experience — Project Detail (`username.mixmomnt.com/project/:repo`)

**URL format:** `alice.mixmomnt.com/project/waves-ui`

**Layout:** Back nav, project header (name, description, badges), tab bar (About / Live Preview), content area.

**About tab:** Rendered README (styled markdown), auto-generated description if no README exists, last commit date, language tags.

**Live Preview tab:** If `liveUrl` exists → embed in iframe with browser chrome (URL bar, traffic light dots). If site blocks embedding (`X-Frame-Options: DENY`) → show screenshot + "Visit Site" button. If no live URL → show About tab with a notice.

**Per-project OG:** Every project URL has its own OG metadata for sharing on X.

**Fallback for no README / no live site:** Auto-generated description from language + recent commit pattern. Not blank. Never blank.

---

### 4c. Chat Designer (authenticated, `app.mixmomnt.com`)

**Activation:** Side panel slides in from the right when the vibecoder clicks "Edit Portfolio". Main profile page remains visible on the left.

**Conversation flow:** Vibecoder types naturally ("make it more minimal", "I want a dark neon vibe"). The AI responds conversationally, confirms the change, and applies it live to the profile on the left.

**First draft:** On first login after connecting GitHub, a draft is auto-generated — top repos pulled, tagline suggested from README, a starting preset applied. The vibecoder starts from a real place, not a blank canvas.

**Vibe presets:** On first sign-in, the system offers 3 presets to choose from before the auto-draft is generated:
- **Clean Dev** — minimal, code-adjacent, focused
- **Bold Maker** — more expressive, larger type, warmer
- **Dark Experimental** — high contrast, maximal on motion

**What the chat can change:** Tagline, bio text, which repos are shown, accent colors (within the dark palette), card layout density, which social links to display, OG title + description.

**What the chat cannot change:** Individual pixel-level layout (that's the job of presets — chat sets high-level intent). Edge cases roll back to the last good state.

**Saving:** All changes auto-save to Convex. No explicit save button.

---

### 4d. Explore Page (`mixmomnt.com/explore`)

Discoverability is the organic growth engine. `mixmomnt.com/explore` shows:
- **Trending vibecoders** — recently updated portfolios with high project count
- **New sign-ups** — latest vibecoders who joined
- **Random finds** — a shuffle of portfolios, refreshed on each visit
- **Filter by stack** — "show only vibecoders who ship React + AI projects"

This turns the platform from a personal link-in-bio tool into a community destination.

---

### 4e. OG Display

**Profile OG:** When `alice.mixmomnt.com` is shared, the OG card shows: alice's avatar, her tagline, a montage or hero image from her top project, and her maker stats.

**Project OG:** When a specific project URL is shared, the card shows: project name, description, live site screenshot or gradient, alice's name + avatar as publisher context.

**Generation:** If the vibecoder hasn't set a custom OG image, the system auto-generates a card using a template from their top project's screenshot + branding.

---

## 5. Component Inventory

### Profile Page
- **HeroSection:** Avatar, display name, tagline, vibe badges, edit button (auth only)
- **BioCard:** Free-text bio with styled text rendering
- **ProjectGrid:** Responsive card grid with stagger-reveal animation
- **ProjectCard:** Screenshot/preview, repo name, description, language tags, live badge
- **SocialLinks:** GitHub, Twitter/X, email — icon + label, full-width on mobile
- **EmptyState:** Placeholder when no projects added yet

### Project Detail Page
- **BackNav:** ← back to [username]
- **ProjectHeader:** Icon, name, description, badges, live badge, GitHub link
- **TabBar:** About / Live Preview toggle
- **ReadmeRenderer:** Styled markdown from GitHub
- **LivePreviewFrame:** iframe with browser chrome, screenshot fallback
- **ProjectCTA:** Two-button footer (View Live Site / GitHub)
- **NoContentFallback:** Auto-generated description when no README

### Chat Designer Panel
- **ChatPanel:** Slide-in panel, fixed to right 40% of screen
- **MessageBubble:** AI messages left-aligned, user messages right-aligned
- **TypingIndicator:** Three-dot pulse while AI is responding
- **DesignPreview:** Live preview of the portfolio updates in real-time
- **PresetSelector:** Shown on first login, 3 visual preset options
- **ChatInput:** Text input with send button, keyboard accessible

### Explore Page
- **VibeCard:** Portrait-sized card for explore grid
- **TrendingSection:** Horizontal scroll of top vibecoders
- **FilterBar:** Stack/language filter chips
- **ShuffleSection:** "Discover" grid with refresh button

---

## 6. Tech Stack

| Layer            | Choice                              | Notes                                              |
|------------------|-------------------------------------|----------------------------------------------------|
| Frontend         | Next.js (App Router)                | SSR for portfolio pages, fast routing              |
| Backend          | Convex                              | Real-time DB, edge functions, built-in auth        |
| Hosting          | Vercel                              | Native Next.js + Convex integration               |
| Database         | Convex (built-in, Postgres-backed)   | Real-time, no separate DB needed                  |
| Auth             | Convex Auth (GitHub OAuth)          | GitHub-first, fits the vibecoder audience          |
| GitHub integration | GitHub REST API via server actions | Repo fetching, README pull, commit history        |
| Screenshots      | Vercel Blob + Cloudflare Screenshots API | For deployed project previews                 |
| Motion           | Framer Motion                       | Page transitions, stagger reveals, hover effects   |
| Styling          | CSS Modules + CSS custom properties  | No Tailwind — keeps design intentional             |
| OG Image gen    | `@vercel/og` or `satori`            | Programmatic OG cards for profiles + projects      |
| Email (optional) | Resend                             | Transactional for onboarding, digest              |

---

## 7. Implementation Phases

### Phase 1 — Core Portfolio (MVP)
- Convex schema, auth, GitHub OAuth
- Subdomain routing in Next.js
- Profile page with auto-imported GitHub repos
- Project detail page with README rendering
- Live preview iframe (with X-Frame-Options fallback)
- Basic OG metadata
- Mobile-responsive layout

### Phase 2 — Chat Designer
- Side panel chat UI
- AI-powered design editing (Claude API via Convex server actions)
- Preset selection on first login
- Auto-generated first draft from GitHub data
- Real-time preview sync

### Phase 3 — OG Polish + Social
- OG image auto-generation
- Per-project OG metadata
- Explore page (trending, new, random)
- Vibe/upvote mechanic

### Phase 4 — Community & Growth
- Email digest for vibecoders (new visitors, vibes received)
- Shareable project collections
- Vibecoder social graph ("builders like you")

---

## 8. Open Questions

- **Email for vibecoders?** Required for onboarding or purely GitHub OAuth? GitHub OAuth alone is lower friction — email can be optional.
- **Custom domain support?** Some vibecoders may want `alice.com` to point to their mixmomnt page. Worth considering in v2.
- **Analytics for vibecoders?** Showing "50 people visited your portfolio this week" could be a powerful motivator. Simple page view counts are easy; deeper analytics v2.
- **Billing model?** Free for all vibecoders initially? When to introduce paid tier? Suggest: free while small, paid when vibecoder wants custom domain or advanced analytics.

---

*Spec written to be reviewed before implementation. Questions or changes — flag before moving to writing-plans.*
