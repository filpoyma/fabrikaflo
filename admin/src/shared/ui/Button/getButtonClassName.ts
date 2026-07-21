import styles from './Button.module.css'
import type { ButtonClassNameOptions } from './buttonTypes'

export function getButtonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  dangerText = false,
  className,
}: ButtonClassNameOptions = {}) {
  return [
    styles.button,
    styles[variant],
    size === 'sm' && styles.sm,
    size === 'lg' && styles.lg,
    fullWidth && styles.fullWidth,
    dangerText && variant === 'secondary' && styles.dangerText,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}
