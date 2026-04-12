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
  const classes = [styles.badge, styles[variant]];
  if (className) classes.push(className);
  return (
    <span className={classes.join(' ')}>
      {variant === 'live' && (
        <span className={styles.liveDot} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}