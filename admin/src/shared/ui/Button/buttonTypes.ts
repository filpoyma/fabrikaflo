export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonClassNameOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  dangerText?: boolean
  className?: string
}
