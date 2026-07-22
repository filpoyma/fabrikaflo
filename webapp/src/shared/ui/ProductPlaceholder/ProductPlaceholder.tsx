import { cx } from '../cx.ts'
import styles from './ProductPlaceholder.module.css'

export interface IProductPlaceholderProps {
  size?: 'default' | 'md' | 'lg'
}

export function ProductPlaceholder({ size = 'default' }: IProductPlaceholderProps) {
  return (
    <div
      className={cx(
        styles.placeholder,
        size === 'lg' && styles.lg,
        size === 'md' && styles.md,
      )}
    >
      f.f
    </div>
  )
}
