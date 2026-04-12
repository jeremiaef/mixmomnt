'use client';

import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import type { Project } from './ProjectCard';
import { fadeUp, staggerContainer } from '@/styles/motion';
import styles from './ProjectGrid.module.css';

export interface ProjectGridProps {
  projects: Project[];
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>projects</h2>
        <span className={styles.count}>{projects.length}</span>
      </div>

      <motion.div
        className={styles.grid}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.repoName}
            variants={fadeUp}
            custom={index}
          >
            <ProjectCard project={project} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}