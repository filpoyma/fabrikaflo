import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../cx.ts'
import styles from './IconButton.module.css'

export type TIconButtonSize = 'md' | 'sm' | 'xs'

export type TIconButtonVariant =
  | 'default'
  | 'floating'
  | 'ghost'
  | 'fab'
  | 'fabRecording'
  | 'fabSm'
  | 'fabSmActive'
  | 'audio'

export interface IIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: TIconButtonSize
  variant?: TIconButtonVariant
  children: ReactNode
}

const variantClass: Record<TIconButtonVariant, string | undefined> = {
  default: undefined,
  floating: styles.floating,
  ghost: styles.ghost,
  fab: styles.fab,
  fabRecording: styles.fabRecording,
  fabSm: styles.fabSm,
  fabSmActive: styles.fabSmActive,
  audio: styles.audio,
}

export function IconButton({
  size = 'md',
  variant = 'default',
  className,
  children,
  type = 'button',
  ...props
}: IIconButtonProps) {
  const useSizeClass = variant === 'default' || variant === 'floating'

  return (
    <button
      type={type}
      className={cx(
        styles.iconButton,
        useSizeClass && styles[size],
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
