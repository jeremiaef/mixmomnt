import Link from 'next/link';
import styles from './BackNav.module.css';

interface BackNavProps {
  username: string;
}

export function BackNav({ username }: BackNavProps) {
  return (
    <nav className={styles.nav}>
      <Link href={`/${username}`} className={styles.link}>
        <span className={styles.arrow} aria-hidden="true">←</span>
        <span>back to @{username}</span>
      </Link>
    </nav>
  );
}