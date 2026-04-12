import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import styles from './HeroSection.module.css';

export interface VibeBadge {
  label: string;
  count: number;
}

export interface HeroSectionData {
  displayName: string;
  username: string;
  tagline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  projectCount: number;
  liveSiteCount: number;
  topLanguages: string[];
}

export interface HeroSectionProps {
  profile: HeroSectionData;
}

export default function HeroSection({ profile }: HeroSectionProps) {
  const vibeBadges: VibeBadge[] = [
    { label: 'projects', count: profile.projectCount },
    { label: 'live', count: profile.liveSiteCount },
    ...profile.topLanguages.slice(0, 2).map((lang) => ({
      label: lang,
      count: 0,
    })),
  ];

  return (
    <section className={styles.hero}>
      {/* ── Identity block: avatar + name (left col) ── */}
      <div className={styles.identityBlock}>
        <Avatar
          src={profile.avatarUrl}
          name={profile.displayName}
          size="lg"
          className={styles.avatar}
        />
        <div className={styles.nameBlock}>
          <h1 className={styles.displayName}>{profile.displayName}</h1>
          <span className={styles.username}>@{profile.username}</span>
          {profile.tagline && (
            <p className={styles.tagline}>{profile.tagline}</p>
          )}
          {/* Vibe badges */}
          <div className={styles.vibeBadges}>
            {vibeBadges.map((badge) =>
              badge.count > 0 ? (
                <span key={badge.label} className={styles.vibeBadge}>
                  <span className={styles.vibeCount}>{badge.count}</span>
                  <span className={styles.vibeLabel}>{badge.label}</span>
                </span>
              ) : (
                <Badge key={badge.label} variant="tag" label={badge.label} />
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Bio card (right col) ── */}
      {profile.bio && (
        <div className={styles.bioCard}>
          <p className={styles.bioText}>{profile.bio}</p>
        </div>
      )}
    </section>
  );
}