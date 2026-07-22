import type { IUser } from '../user/index.ts'

export type TDeliveryType = 'PICKUP' | 'DELIVERY'

export type TInquiryStatus = 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED'

/** Customer flower inquiry before it becomes an order (Prisma `Request`). */
export interface IFlowerInquiry {
  id: string
  clientId: string
  client?: IUser
  occasion: string
  budget: number
  date: string | null
  deliveryType: TDeliveryType
  deliveryAddress: string | null
  recipientPhone: string | null
  postcardText: string | null
  comment: string | null
  examplePhotoUrl: string | null
  status: TInquiryStatus
  createdAt: string
  updatedAt: string
}
