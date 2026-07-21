import React from 'react'
import { getInputClassName } from './getInputClassName'
import type { FieldSize } from './inputTypes'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldSize?: FieldSize
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ fieldSize = 'md', className, style, ...props }, ref) => (
    <textarea
      ref={ref}
      className={getInputClassName({ fieldSize, multiline: true, className })}
      style={style}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
