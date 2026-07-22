import type { ReactNode } from 'react'

export type UpdateCartFn = () => void | Promise<void>

export interface PageWithCartProps {
  updateCart?: UpdateCartFn
}

export interface SplashScreenProps {
  visible: boolean
}

export interface ProtectedRouteProps {
  children: ReactNode
}

export interface NavShellProps {
  cartCount?: number
}

export interface LatLng {
  lat: number
  lng: number
}
