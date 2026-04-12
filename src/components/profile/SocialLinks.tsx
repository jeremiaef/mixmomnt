import { motion } from 'framer-motion';
import styles from './SocialLinks.module.css';

export interface SocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface SocialLinksProps {
  links: SocialLink[];
}

export default function SocialLinks({ links }: SocialLinksProps) {
  if (links.length === 0) return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.divider} />
      <nav className={styles.nav} aria-label="Social links">
        {links.map((link) => (
          <motion.a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className={styles.icon} aria-hidden="true">
              {link.icon}
            </span>
            <span className={styles.label}>{link.label}</span>
          </motion.a>
        ))}
      </nav>
    </footer>
  );
}