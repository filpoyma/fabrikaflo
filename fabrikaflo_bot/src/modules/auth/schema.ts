import { Type } from '@sinclair/typebox'

export const UserSchema = Type.Object({
  id: Type.String(),
  telegramId: Type.Union([Type.String(), Type.Null()]),
  tgname: Type.Union([Type.String(), Type.Null()]),
  name: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  role: Type.String(),
  createdAt: Type.Any(),
  updatedAt: Type.Any(),
})

export const loginSchema = {
  tags: ['auth'],
  body: Type.Object({
    login: Type.String(),
    password: Type.String(),
  }),
  response: {
    200: Type.Object({
      token: Type.String(),
      user: UserSchema,
    }),
  },
}

export const getMeSchema = {
  tags: ['auth'],
  response: {
    200: Type.Object({
      user: UserSchema,
    }),
  },
}
