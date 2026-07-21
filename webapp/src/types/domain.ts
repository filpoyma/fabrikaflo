export interface IUser {
  id: string
  telegramId: string | null
  tgname: string | null
  name: string | null
  phone: string | null
  role: 'CLIENT' | 'ADMIN' | 'COURIER'
  createdAt: string
  updatedAt: string
}

export interface IRequest {
  id: string
  clientId: string
  client?: IUser
  occasion: string
  budget: number
  date: string | null
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress: string | null
  recipientPhone: string | null
  postcardText: string | null
  comment: string | null
  examplePhotoUrl: string | null
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface IOrderPhoto {
  id: string
  orderId: string
  photoUrl: string
  createdAt: string
}

export interface IOrder {
  id: string
  clientId: string
  client?: IUser
  requestId: string | null
  request?: IRequest | null
  recipientName: string | null
  recipientPhone: string | null
  deliveryAddress: string | null
  deliveryTime: string | null
  budget: number
  wishes: string | null
  postcardText: string | null
  comment: string | null
  clientFeedback: string | null
  status:
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
  paymentLink: string | null
  courierId: string | null
  courier?: IUser | null
  createdAt: string
  updatedAt: string
  photos?: IOrderPhoto[]
}

export interface IPortfolioItem {
  id: string
  photoUrl: string
  title: string | null
  description: string | null
  createdAt: string
}
