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

export interface ICartItem {
  product_id: string
  variant_index: number
  quantity: number
  price_usd: number
  subtotal_display?: string
  name?: string
  photo_url?: string
}

export interface ICart {
  items: ICartItem[]
  subtotal_usd: number
  total_usd?: number
  subtotal_display?: string
  total_display?: string
  discount_percent?: number
  discount_usd?: number
}

export interface IAdminPermissions {
  can_edit_products?: boolean
  has_full_access?: boolean
}

export interface IClientProfile {
  id?: string
  name?: string | null
  phone?: string | null
  photo_url?: string | null
  address?: string | null
  address_lat?: number | null
  address_lng?: number | null
  is_admin?: boolean
  is_partner?: boolean
  referral_code?: string
  referral_link?: string
  referral_percent?: number
  referred_by_user?: {
    id?: string
    name?: string
    tgname?: string
  } | null
  admin_permissions?: IAdminPermissions
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

export interface IAdminSettings {
  referral_percent?: number
  [key: string]: unknown
}

export interface IAdminStats {
  [key: string]: unknown
}

export interface ITeamMember {
  id: string
  name?: string
  tgname?: string
  role?: string
}

export interface IReferralUser {
  [key: string]: unknown
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
