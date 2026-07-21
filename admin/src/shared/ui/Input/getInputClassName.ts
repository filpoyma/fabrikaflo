import clsx from 'clsx'
import styles from './Input.module.css'
import type { InputClassNameOptions } from './inputTypes'

export function getInputClassName({
  fieldSize = 'md',
  hidden = false,
  multiline = false,
  className,
}: InputClassNameOptions = {}) {
  return clsx(
    styles.field,
    fieldSize === 'sm' && styles.sm,
    multiline && styles.textarea,
    hidden && styles.hidden,
    className,
  )
}
