import React from 'react'
import { getInputClassName } from './getInputClassName'
import type { FieldSize } from './inputTypes'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  fieldSize?: FieldSize
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ fieldSize = 'md', className, style, children, ...props }, ref) => (
    <select ref={ref} className={getInputClassName({ fieldSize, className })} style={style} {...props}>
      {children}
    </select>
  ),
)

Select.displayName = 'Select'
