import type { ReactNode } from 'react'
import styles from './PageTitle.module.css'

export interface IPageTitleProps {
  eyebrow: string
  children: ReactNode
}

export function PageTitle({ eyebrow, children }: IPageTitleProps) {
  return (
    <div className="page-title">
      <div className={styles.root}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className={styles.heading}>{children}</h1>
      </div>
    </div>
  )
}
