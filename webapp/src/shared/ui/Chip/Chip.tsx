import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../cx.ts'
import styles from './Chip.module.css'

export interface IChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: ReactNode
}

export function Chip({ active, className, children, type = 'button', ...props }: IChipProps) {
  return (
    <button
      type={type}
      className={cx(styles.chip, active && styles.active, className)}
      {...props}
    >
      {children}
    </button>
  )
}
