import type { ISectionProps } from '../../../../types/ui.ts'
import styles from './CheckoutSection.module.css'

export function CheckoutSection({ eyebrow, title, children }: ISectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={`eyebrow ${styles.eyebrow}`}>{eyebrow}</span>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {children}
    </section>
  )
}
