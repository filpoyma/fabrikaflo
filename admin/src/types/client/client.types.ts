export interface IClientStats {
  id: string
  telegramId: string | null
  tgname: string | null
  name: string | null
  phone: string | null
  role: string
  createdAt: string
  ordersCount: number
  totalSpend: number
  averageCheck: number
}
