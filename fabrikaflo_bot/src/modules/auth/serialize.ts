import type { User } from '../../generated/prisma/client.ts'

export type PublicUser = {
  id: string
  telegramId: string | null
  tgname: string | null
  name: string | null
  phone: string | null
  avatarUrl: string | null
  address: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    telegramId: user.telegramId,
    tgname: user.tgname,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    address: user.address,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
