import React from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import styles from './Button.module.css'
import { getButtonClassName } from './getButtonClassName'
import type { ButtonSize, ButtonVariant } from './buttonTypes'

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: IconComponent
  dangerText?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

type ButtonAsButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    to?: undefined
  }

type ButtonAsLinkProps = ButtonBaseProps &
  Omit<React.ComponentProps<typeof Link>, keyof ButtonBaseProps> & {
    to: string
  }

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps

const iconClassBySize: Record<ButtonSize, string> = {
  sm: styles.iconSm,
  md: styles.iconMd,
  lg: styles.iconLg,
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  dangerText = false,
  children,
  className,
  style,
  to,
  ...props
}) => {
  const classes = getButtonClassName({ variant, size, fullWidth, dangerText, className })

  const content = (
    <>
      {Icon && <Icon className={clsx(styles.icon, iconClassBySize[size])} />}
      {children}
    </>
  )

  if (to) {
    const linkProps = props as Omit<ButtonAsLinkProps, keyof ButtonBaseProps | 'to'>
    return (
      <Link to={to} className={classes} style={style} {...linkProps}>
        {content}
      </Link>
    )
  }

  const buttonProps = props as Omit<ButtonAsButtonProps, keyof ButtonBaseProps | 'to'>
  return (
    <button type="button" className={classes} style={style} {...buttonProps}>
      {content}
    </button>
  )
}
