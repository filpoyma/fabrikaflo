import type { ReactNode } from 'react'
import type { LatLng } from './pages.ts'
import type { TDeliveryType } from './domain.ts'

export interface IChatMessage {
  sender: 'ai' | 'user'
  text: string
}

export interface IAiChatMessage extends IChatMessage {
  id?: number | string
  audioUrl?: string | null
}

export interface ICheckoutFormState {
  occasion: string
  customOccasion: string
  budget: number
  deliveryDate: string
  deliveryTime: string
  deliveryType: TDeliveryType
  deliveryAddress: string
  recipientPhone: string
  postcardText: string
  comment: string
  examplePhotoUrl: string
}

export interface ILocationPickerProps {
  position: LatLng | null
  onPositionChange: (latlng: LatLng) => void | Promise<void>
}

export interface ISectionProps {
  eyebrow: string
  title: string
  children: ReactNode
}

export interface IStatusTone {
  bg: string
  fg: string
  bd: string
}

export interface INominatimReverseResponse {
  display_name?: string
}
