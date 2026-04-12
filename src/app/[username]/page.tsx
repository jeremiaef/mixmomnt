import type { Metadata } from 'next';
import HeroSection from '@/components/profile/HeroSection';
import ProjectGrid from '@/components/profile/ProjectGrid';
import SocialLinks from '@/components/profile/SocialLinks';
import EmptyState from '@/components/profile/EmptyState';
import styles from './page.module.css';

// ── Mock data ─────────────────────────────────────────────────────────────────
// Used until Convex is deployed. Swap getProfile call in the async function
// below to pull real data once the backend is connected.

const MOCK_PROJECTS = [
  {
    repoName: 'vibe-shell',
    description:
      'AI-powered terminal that learns your workflow and suggests the next command before you type it.',
    language: 'Rust',
    hasLiveSite: true,
    previewGradient: 'linear-gradient(135deg, #0a1a12 0%, #1a3a2a 100%)',
    emoji: '🖥',
  },
  {
    repoName: 'dotsync',
    description:
      'Sync your dotfiles across machines with a single config file. Git-backed, encrypted, and fast.',
    language: 'Go',
    hasLiveSite: true,
    previewGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
    emoji: '🔗',
  },
  {
    repoName: 'mood-radio',
    description:
      'Ambient music generator that adapts to your typing cadence. Built with the Web Audio API.',
    language: 'TypeScript',
    hasLiveSite: false,
    previewGradient: 'linear-gradient(135deg, #1a0a1a 0%, #2a1a2a 100%)',
    emoji: '🎧',
  },
  {
    repoName: 'terminal-paint',
    description: 'Draw in your terminal with ASCII art and ANSI colors. Exports to SVG.',
    language: 'Python',
    hasLiveSite: true,
    previewGradient: 'linear-gradient(135deg, #1a1a0a 0%, #2a2a1a 100%)',
    emoji: '🎨',
  },
  {
    repoName: 'logfire',
    description: 'Real-time log explorer with regex search, live tail, and alerting.',
    language: 'TypeScript',
    hasLiveSite: true,
    previewGradient: 'linear-gradient(135deg, #1a0a0a 0%, #3a1a1a 100%)',
    emoji: '🔥',
  },
  {
    repoName: 'ship-tracker',
    description: 'Track container ships in real time. Uses AIS data and renders on a live map.',
    language: 'JavaScript',
    hasLiveSite: false,
    previewGradient: 'linear-gradient(135deg, #0a1a2a 0%, #0a2a4a 100%)',
    emoji: '🚢',
  },
];

const MOCK_SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:hello@example.com',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
];

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  props: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await props.params;
  const title = `${username} — mixmomnt`;
  return {
    title,
    description: `${username}'s portfolio on mixmomnt. Built from the things they ship.`,
    openGraph: {
      title,
      description: `${username}'s portfolio on mixmomnt.`,
      type: 'profile',
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage(
  props: { params: Promise<{ username: string }> }
) {
  const { username } = await props.params;

  // ── Data fetching ──────────────────────────────────────────────────────────
  // TODO: Replace with real Convex query when backend is connected.
  //
  //   const profile = await convex.query(api.profile.getProfile, { username });
  //
  // The shape must match the HeroSectionProps['profile'] interface.
  // See: src/components/profile/HeroSection.tsx

  const profile = {
    displayName: username,
    username,
    tagline: 'building in public',
    bio: 'Full-stack dev. Obsessed with developer tooling and weird side projects. Ship fast, break things, iterate.',
    avatarUrl: null,
    projectCount: MOCK_PROJECTS.length,
    liveSiteCount: MOCK_PROJECTS.filter((p) => p.hasLiveSite).length,
    topLanguages: ['TypeScript', 'Rust', 'Go'],
  };

  const hasProjects = MOCK_PROJECTS.length > 0;

  return (
    <main className={styles.page}>
      {hasProjects ? (
        <>
          <HeroSection profile={profile} />
          <ProjectGrid projects={MOCK_PROJECTS} />
          <SocialLinks links={MOCK_SOCIAL_LINKS} />
        </>
      ) : (
        <EmptyState username={username} />
      )}
    </main>
  );
}