import type { ReactNode } from 'react'
import { IconButton } from '../IconButton/index.ts'
import styles from './QtyStepper.module.css'

export interface IQtyStepperProps {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
  size?: 'sm' | 'md'
  decreaseIcon: ReactNode
  increaseIcon: ReactNode
  increaseDisabled?: boolean
  decreaseTestId?: string
  increaseTestId?: string
}

export function QtyStepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  size = 'md',
  decreaseIcon,
  increaseIcon,
  increaseDisabled,
  decreaseTestId,
  increaseTestId,
}: IQtyStepperProps) {
  return (
    <div className={styles.root}>
      <IconButton
        size={size === 'sm' ? 'xs' : 'sm'}
        onClick={onDecrease}
        aria-label={decreaseLabel}
        data-testid={decreaseTestId}
      >
        {decreaseIcon}
      </IconButton>
      <span className={size === 'sm' ? styles.valueSm : styles.valueMd}>{value}</span>
      <IconButton
        size={size === 'sm' ? 'xs' : 'sm'}
        disabled={increaseDisabled}
        onClick={onIncrease}
        aria-label={increaseLabel}
        data-testid={increaseTestId}
      >
        {increaseIcon}
      </IconButton>
    </div>
  )
}
