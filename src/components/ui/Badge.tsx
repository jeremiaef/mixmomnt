import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'live' | 'tag';

export interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  className?: string;
}

export default function Badge({
  variant = 'default',
  label,
  className,
}: BadgeProps) {
  return (
    <span className={[styles.badge, styles[variant], className ?? ''].join(' ')}>
      {variant === 'live' && (
        <span className={styles.liveDot} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}