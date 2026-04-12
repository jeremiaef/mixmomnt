import type { Metadata } from 'next';
import { BackNav } from '@/components/project/BackNav';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectTabContent } from '@/components/project/ProjectTabContent';
import { ProjectCTA } from '@/components/project/ProjectCTA';
import styles from './page.module.css';

// ── Mock data ─────────────────────────────────────────────────────────────────
// TODO: Replace with Convex queries once the backend is connected.
//
//   const project = await convex.query(api.project.getProject, { username, repo });
//   const readme  = await convex.query(api.project.getReadme,  { username, repo });

export interface PageProject {
  repoName: string;
  description: string | null;
  language: string | null;
  hasLiveSite: boolean;
  liveUrl?: string | null;
  emoji?: string | null;
  ownerUsername: string;
  ownerGithubUrl: string;
  readme: string;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  props: { params: Promise<{ username: string; repo: string }> }
): Promise<Metadata> {
  const { username, repo } = await props.params;
  const title = `${repo} — ${username} @ mixmomnt`;
  return {
    title,
    description: `Explore ${repo} by ${username} on mixmomnt. Built from the things they ship.`,
    openGraph: {
      title,
      description: `${repo} by ${username}`,
      type: 'article',
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProjectDetailPage(
  props: { params: Promise<{ username: string; repo: string }> }
) {
  const { username, repo } = await props.params;

  // ── Mock project data ─────────────────────────────────────────────────────
  const project: PageProject = {
    repoName: repo,
    description:
      'AI-powered terminal that learns your workflow and suggests the next command before you type it.',
    language: 'Rust',
    hasLiveSite: true,
    liveUrl: 'https://example.com',
    emoji: '🖥',
    ownerUsername: username,
    ownerGithubUrl: `https://github.com/${username}/${repo}`,
    readme: '',
  };

  return (
    <main className={styles.page}>
      <BackNav username={username} />
      <ProjectHeader
        repoName={project.repoName}
        description={project.description}
        language={project.language}
        hasLiveSite={project.hasLiveSite}
        emoji={project.emoji}
        ownerUsername={project.ownerUsername}
      />
      <ProjectTabContent
        readme={project.readme}
        liveUrl={project.liveUrl}
        repoName={project.repoName}
      />
      <ProjectCTA
        liveUrl={project.liveUrl}
        githubUrl={project.ownerGithubUrl}
      />
    </main>
  );
}