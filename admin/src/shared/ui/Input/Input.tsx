import React from 'react'
import { getInputClassName } from './getInputClassName'
import type { FieldSize } from './inputTypes'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldSize?: FieldSize
  hidden?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ fieldSize = 'md', hidden = false, className, style, type, ...props }, ref) => {
    const isHidden = hidden || type === 'hidden'

    return (
      <input
        ref={ref}
        type={type}
        className={getInputClassName({ fieldSize, hidden: isHidden, className })}
        style={style}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
