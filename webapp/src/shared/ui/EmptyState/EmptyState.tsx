import type { ReactNode } from 'react'
import { cx } from '../cx.ts'
import styles from './EmptyState.module.css'

export type TEmptyStateVariant = 'default' | 'padded' | 'article' | 'catalog'

export interface IEmptyStateProps {
  word: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  variant?: TEmptyStateVariant
  className?: string
}

const rootClass: Record<TEmptyStateVariant, string> = {
  default: styles.root,
  padded: styles.rootPadded,
  article: styles.rootArticle,
  catalog: styles.root,
}

export function EmptyState({
  word,
  title,
  description,
  action,
  variant = 'default',
  className,
}: IEmptyStateProps) {
  const wordClass = variant === 'catalog' ? styles.wordCatalog : styles.word

  return (
    <div className={cx(rootClass[variant], className)}>
      <div className={wordClass}>{word}</div>
      <div className={styles.rule} />
      <h2 className={styles.title}>{title}</h2>
      {description && (
        <p className={variant === 'catalog' ? styles.descriptionCatalog : styles.description}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
