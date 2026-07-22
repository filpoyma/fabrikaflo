import type { ReactNode } from 'react'
import { IconButton } from '../IconButton/index.ts'
import type { IIconButtonProps } from '../IconButton/index.ts'
import styles from './BackFloating.module.css'

export interface IBackFloatingProps extends Omit<IIconButtonProps, 'variant' | 'children'> {
  children: ReactNode
}

export function BackFloating({ children, ...props }: IBackFloatingProps) {
  return (
    <div className={styles.wrap}>
      <IconButton variant="floating" {...props}>
        {children}
      </IconButton>
    </div>
  )
}
