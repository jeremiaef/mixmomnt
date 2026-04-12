import ReactMarkdown from 'react-markdown';
import styles from './ReadmeRenderer.module.css';

interface ReadmeRendererProps {
  content: string;
}

export function ReadmeRenderer({ content }: ReadmeRendererProps) {
  if (!content) return null;
  return (
    <div className={styles.markdown}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}