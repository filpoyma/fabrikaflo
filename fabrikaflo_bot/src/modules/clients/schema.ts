import { Type } from '@sinclair/typebox'
import { UserSchema } from '../auth/schema.ts'

export const ClientStatsSchema = Type.Object({
  id: Type.String(),
  telegramId: Type.Union([Type.String(), Type.Null()]),
  tgname: Type.Union([Type.String(), Type.Null()]),
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

export const profileSchema = {
  tags: ['clients'],
  response: {
    200: Type.Object({
      data: UserSchema,
    }),
  },
}

export const updateProfileSchema = {
  tags: ['clients'],
  body: Type.Object({
    name: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),
  }),
  response: {
    200: Type.Object({
      data: UserSchema,
    }),
  },
}
