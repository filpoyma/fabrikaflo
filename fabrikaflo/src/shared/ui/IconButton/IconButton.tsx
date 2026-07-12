import React from 'react'
import DocumentIcon from '../../../assets/icons/document.svg'
import TrashIcon from '../../../assets/icons/trash.svg'

type IconButtonVariant = 'edit' | 'delete'
type IconButtonAppearance = 'outline' | 'filled'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: IconButtonVariant
  appearance?: IconButtonAppearance
  loading?: boolean
}

const outlineStyles: Record<IconButtonVariant, { border: string; color: string; hoverBg: string }> = {
  edit: {
    border: '1px solid rgba(130, 160, 100, 0.3)',
    color: 'rgba(130, 160, 100, 0.85)',
    hoverBg: 'var(--color-sage)',
  },
  delete: {
    border: '1px solid rgba(200, 92, 92, 0.3)',
    color: 'rgba(200, 92, 92, 0.85)',
    hoverBg: 'rgba(200, 92, 92, 0.95)',
  },
}

const filledStyles: Record<IconButtonVariant, { backgroundColor: string; hoverBg: string }> = {
  edit: {
    backgroundColor: 'var(--color-sage)',
    hoverBg: 'var(--color-accent-dark)',
  },
  delete: {
    backgroundColor: 'rgba(200, 92, 92, 0.95)',
    hoverBg: 'rgba(200, 92, 92, 0.95)',
  },
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant,
  appearance = 'outline',
  loading = false,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const isOutline = appearance === 'outline'
  const outlineVariant = isOutline ? outlineStyles[variant] : null
  const filledVariant = isOutline ? null : filledStyles[variant]

  const baseStyle: React.CSSProperties = {
    padding: isOutline ? '8px' : '10px',
    borderRadius: isOutline ? '8px' : '50%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    ...(outlineVariant
      ? {
          backgroundColor: 'transparent',
          border: outlineVariant.border,
          color: outlineVariant.color,
        }
      : {
          backgroundColor: filledVariant!.backgroundColor,
          color: 'white',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }),
    ...style,
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = isOutline
        ? outlineVariant!.hoverBg
        : filledVariant!.hoverBg
      if (isOutline) e.currentTarget.style.color = 'white'
    }
    onMouseEnter?.(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (outlineVariant) {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = outlineVariant.color
      } else {
        e.currentTarget.style.backgroundColor = filledVariant!.backgroundColor
      }
    }
    onMouseLeave?.(e)
  }

  const Icon = variant === 'edit' ? DocumentIcon : TrashIcon

  return (
    <button
      type="button"
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <Icon
        style={{
          width: '16px',
          height: '16px',
          ...(variant === 'delete'
            ? {
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: loading ? 'scale(1.45)' : 'scale(1)',
              }
            : {}),
        }}
      />
    </button>
  )
}
