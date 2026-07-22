import type { ReactNode } from 'react'
import type { IRepeatCheckoutState } from '../shared/order/orderRepeat.ts'

export interface ProtectedRouteProps {
  children: ReactNode
}

export interface LatLng {
  lat: number
  lng: number
}

export interface ICheckoutLocationState {
  repeatOrder?: IRepeatCheckoutState
}
