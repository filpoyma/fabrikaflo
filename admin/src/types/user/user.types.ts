export type TUserRole = 'CLIENT' | 'ADMIN' | 'COURIER'

export interface IUser {
  id: string
  telegramId: string | null
  tgname: string | null
  name: string | null
  phone: string | null
  role: TUserRole
  createdAt: string
  updatedAt: string
}
