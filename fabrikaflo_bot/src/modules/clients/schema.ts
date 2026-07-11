import { Type } from '@sinclair/typebox'
import { UserSchema } from '../auth/schema.ts'

export const ClientStatsSchema = Type.Object({
  id: Type.String(),
  telegramId: Type.Union([Type.String(), Type.Null()]),
  username: Type.Union([Type.String(), Type.Null()]),
  name: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  role: Type.String(),
  createdAt: Type.Any(),
  ordersCount: Type.Number(),
  totalSpend: Type.Number(),
  averageCheck: Type.Number(),
})

export const listClientsSchema = {
  tags: ['clients'],
  response: {
    200: Type.Object({
      data: Type.Array(ClientStatsSchema),
    }),
  },
}

export const listCouriersSchema = {
  tags: ['clients'],
  response: {
    200: Type.Object({
      data: Type.Array(UserSchema),
    }),
  },
}
