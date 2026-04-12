'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import { cardHover } from '@/styles/motion';
import styles from './ProjectCard.module.css';

export interface Project {
  repoName: string;
  description?: string | null;
  language?: string | null;
  hasLiveSite: boolean;
  previewGradient?: string | null;
  emoji?: string | null;
}

export interface ProjectCardProps {
  project: Project;
  index: number;
}

const GRADIENT_FALLBACKS: Record<string, string> = {
  TypeScript: 'linear-gradient(135deg, #1a2a3a 0%, #2a3a5a 100%)',
  JavaScript: 'linear-gradient(135deg, #2a2a1a 0%, #4a3a0a 100%)',
  Python: 'linear-gradient(135deg, #1a2a2a 0%, #0a3a4a 100%)',
  Rust: 'linear-gradient(135deg, #2a1a1a 0%, #5a2a0a 100%)',
  Go: 'linear-gradient(135deg, #0a1a2a 0%, #0a4a6a 100%)',
  Ruby: 'linear-gradient(135deg, #2a0a1a 0%, #4a1a2a 100%)',
  default: 'linear-gradient(135deg, #1a1a2a 0%, #2a2a4a 100%)',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const gradient =
    project.previewGradient ?? GRADIENT_FALLBACKS[project.language ?? ''] ?? GRADIENT_FALLBACKS.default;

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
    >
      <Link href={`/${project.repoName}`} className={styles.card}>
        {/* Preview area */}
        <div
          className={styles.preview}
          style={{ background: gradient }}
          aria-hidden="true"
        >
          <span className={styles.emoji}>{project.emoji ?? '⚡'}</span>
        </div>

        {/* Card body */}
        <div className={styles.body}>
          <div className={styles.repoNameRow}>
            <span className={styles.repoName}>{project.repoName}</span>
            {project.hasLiveSite && (
              <Badge variant="live" label="live" />
            )}
          </div>

          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}

          {project.language && (
            <div className={styles.footer}>
              <Badge variant="tag" label={project.language} />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}