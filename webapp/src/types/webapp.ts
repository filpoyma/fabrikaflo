import type { IOrder, IPortfolioItem } from './domain.ts'

export interface IProductVariant {
  name: string
  price_usd?: number
  price_display?: string
  old_price_display?: string
}

export interface IProduct {
  id: string
  name: string
  description: string
  photo_url: string | null
  category_slug: string
  category_name: string
  in_stock: boolean
  variants: IProductVariant[]
  price_display?: string
  old_price_display?: string
  is_sale?: boolean
  discount_percent?: number
}

export interface ICategory {
  name: string
  slug: string
}

export interface ILegacyOrderLineItem {
  qty?: number
  name?: string
  variant?: string
  subtotal?: number
}

/** Legacy shop order shape still used in Profile UI */
export interface IProfileLegacyOrder {
  id?: string | number
  status?: string
  created_at?: string
  items?: ILegacyOrderLineItem[]
  currency?: string
  total_in_currency?: number | string
  payment_details?: string
}

export interface IClientProfile {
  id?: string
  name?: string | null
  phone?: string | null
  tgname?: string | null
  photo_url?: string | null
  address?: string | null
  address_lat?: number | null
  address_lng?: number | null
  discount_percent?: number
  role?: string
}

export interface ICreateRequestPayload {
  occasion: string
  budget: number
  date: string | null
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress: string
  recipientPhone: string
  postcardText: string | null
  comment: string | null
  examplePhotoUrl: string | null
}

export interface IArticle {
  id: string
  title: string
  short_description: string
  content: string
  photo_url: string | null
}

export interface ITeamMember {
  id: string
  name?: string
  tgname?: string
  role?: string
}

export interface IAiChatResponse {
  ok: boolean
  text?: string
  audio_url?: string | null
  user_text?: string
}

export type IGalleryItem = IPortfolioItem

export type IProductInput = Partial<
  Pick<IProduct, 'name' | 'description' | 'photo_url' | 'in_stock' | 'is_sale' | 'discount_percent'>
> & {
  variants?: IProductVariant[]
}

export type IOrderListItem = IOrder & {
  title?: string
  photo_url?: string
  receipt_url?: string
}
