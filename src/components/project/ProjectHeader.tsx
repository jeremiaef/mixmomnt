import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import styles from './ProjectHeader.module.css';

interface ProjectHeaderProps {
  repoName: string;
  description: string | null;
  language: string | null;
  hasLiveSite: boolean;
  emoji?: string | null;
  ownerUsername: string;
}

export function ProjectHeader({
  repoName,
  description,
  language,
  hasLiveSite,
  emoji,
  ownerUsername,
}: ProjectHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.repoInfo}>
        <div className={styles.iconWrap} aria-hidden="true">
          <span className={styles.emoji}>{emoji ?? '⚡'}</span>
        </div>
        <div className={styles.textBlock}>
          <div className={styles.titleRow}>
            <h1 className={styles.repoName}>{repoName}</h1>
            {hasLiveSite && (
              <Badge variant="live" label="live" />
            )}
          </div>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
          {language && (
            <Badge variant="tag" label={language} />
          )}
        </div>
      </div>
    </header>
  );
}