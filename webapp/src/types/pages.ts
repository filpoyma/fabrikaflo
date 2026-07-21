import type { ReactNode } from 'react'

export type UpdateCartFn = () => void | Promise<void>

export interface PageWithCartProps {
  updateCart?: UpdateCartFn
}

export interface AdminPageProps {
  profile?: {
    is_admin?: boolean
    [key: string]: unknown
  }
}

export interface SplashScreenProps {
  visible: boolean
}

export interface ProtectedRouteProps {
  children: ReactNode
}

export interface NavShellProps {
  isAdmin?: boolean
  cartCount?: number
}

export interface LatLng {
  lat: number
  lng: number
}
