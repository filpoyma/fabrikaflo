import type { IFlowerInquiry } from '../inquiry/index.ts'
import type { IUser } from '../user/index.ts'

export type TOrderStatus =
  | 'CREATED'
  | 'ASSEMBLING'
  | 'ASSEMBLED'
  | 'WAITING_FOR_APPROVAL'
  | 'APPROVED'
  | 'WAITING_FOR_PAYMENT'
  | 'PAID'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED'

export interface IOrderPhoto {
  id: string
  orderId: string
  photoUrl: string
  createdAt: string
}

/** Writable delivery and recipient fields shared by create and convert flows. */
export type TOrderDetailsPayload = {
  recipientName?: string
  recipientPhone?: string
  deliveryAddress?: string
  deliveryTime?: string
  budget: number
  wishes?: string
  postcardText?: string
  comment?: string
}

export type TCreateDirectOrderPayload = TOrderDetailsPayload & {
  clientId: string
}

/** Flower order created from an inquiry or directly in admin (Prisma `Order`). */
export interface IFlowerOrder {
  id: string
  clientId: string
  client?: IUser
  requestId: string | null
  request?: IFlowerInquiry | null
  recipientName: string | null
  recipientPhone: string | null
  deliveryAddress: string | null
  deliveryTime: string | null
  budget: number
  wishes: string | null
  postcardText: string | null
  comment: string | null
  clientFeedback: string | null
  status: TOrderStatus
  paymentLink: string | null
  courierId: string | null
  courier?: IUser | null
  createdAt: string
  updatedAt: string
  photos?: IOrderPhoto[]
}
