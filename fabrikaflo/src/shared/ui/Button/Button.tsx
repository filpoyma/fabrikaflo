import React from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

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

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '0.8rem', gap: '4px' },
  md: { gap: '8px' },
  lg: { padding: '12px', fontSize: '1rem', gap: '8px' },
}

const iconSizes: Record<ButtonSize, number> = {
  sm: 12,
  md: 16,
  lg: 16,
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
  const classes = ['btn', `btn-${variant}`, fullWidth && 'w-100', className].filter(Boolean).join(' ')

  const combinedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...sizeStyles[size],
    ...(dangerText && variant === 'secondary' ? { color: 'var(--color-error)' } : {}),
    ...style,
  }

  const content = (
    <>
      {Icon && <Icon style={{ width: iconSizes[size], height: iconSizes[size], flexShrink: 0 }} />}
      {children}
    </>
  )

  if (to) {
    const linkProps = props as Omit<ButtonAsLinkProps, keyof ButtonBaseProps | 'to'>
    return (
      <Link to={to} className={classes} style={combinedStyle} {...linkProps}>
        {content}
      </Link>
    )
  }

  const buttonProps = props as Omit<ButtonAsButtonProps, keyof ButtonBaseProps | 'to'>
  return (
    <button type="button" className={classes} style={combinedStyle} {...buttonProps}>
      {content}
    </button>
  )
}
