import styles from './SaleBadge.module.css'

export interface ISaleBadgeProps {
  percent: number
  size?: 'sm' | 'lg'
}

export function SaleBadge({ percent, size = 'sm' }: ISaleBadgeProps) {
  return (
    <div className={size === 'lg' ? styles.badgeLg : styles.badge}>
      −{percent}%
    </div>
  )
}
