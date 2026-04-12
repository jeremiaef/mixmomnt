import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  username: string;
}

export default function EmptyState({ username }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.message}>
          <span className={styles.username}>{username}</span>
          {' is building something. check back soon.'}
        </p>
      </div>
    </div>
  );
}