import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../cx.ts'
import type { TButtonSize, TButtonTone, TButtonVariant } from './buttonTypes.ts'
import styles from './Button.module.css'

type TButtonBaseProps = {
  variant?: TButtonVariant
  size?: TButtonSize
  tone?: TButtonTone
  fullWidth?: boolean
  flex?: boolean
  className?: string
  children?: ReactNode
}

type TButtonAsButtonProps = TButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof TButtonBaseProps> & {
    to?: undefined
    href?: undefined
  }

type TButtonAsLinkProps = TButtonBaseProps &
  Omit<React.ComponentProps<typeof Link>, keyof TButtonBaseProps> & {
    to: string
    href?: undefined
  }

type TButtonAsAnchorProps = TButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof TButtonBaseProps> & {
    href: string
    to?: undefined
  }

export type TButtonProps = TButtonAsButtonProps | TButtonAsLinkProps | TButtonAsAnchorProps

function getButtonClassName({
  variant = 'primary',
  size = 'md',
  tone = 'default',
  fullWidth,
  flex,
  className,
}: TButtonBaseProps): string {
  return cx(
    styles.button,
    styles[variant],
    size === 'sm' && styles.sm,
    size === 'lg' && styles.lg,
    tone === 'danger' && styles.danger,
    fullWidth && styles.fullWidth,
    flex && styles.flex,
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  tone = 'default',
  fullWidth,
  flex,
  className,
  children,
  to,
  href,
  ...props
}: TButtonProps) {
  const classes = getButtonClassName({ variant, size, tone, fullWidth, flex, className })

  if (to) {
    const linkProps = props as Omit<TButtonAsLinkProps, keyof TButtonBaseProps | 'to'>
    return (
      <Link to={to} className={classes} {...linkProps}>
        {children}
      </Link>
    )
  }

  if (href) {
    const anchorProps = props as Omit<TButtonAsAnchorProps, keyof TButtonBaseProps | 'href'>
    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    )
  }

  const buttonProps = props as Omit<TButtonAsButtonProps, keyof TButtonBaseProps>
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
