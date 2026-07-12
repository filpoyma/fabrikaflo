import { Type } from '@sinclair/typebox'
import { UserSchema } from '../auth/schema.ts'

export const RequestSchema = Type.Object({
  id: Type.String(),
  clientId: Type.String(),
  client: Type.Optional(UserSchema),
  occasion: Type.String(),
  budget: Type.Number(),
  date: Type.Union([Type.Any(), Type.Null()]),
  deliveryType: Type.String(),
  deliveryAddress: Type.Union([Type.String(), Type.Null()]),
  recipientPhone: Type.Union([Type.String(), Type.Null()]),
  postcardText: Type.Union([Type.String(), Type.Null()]),
  comment: Type.Union([Type.String(), Type.Null()]),
  examplePhotoUrl: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  createdAt: Type.Any(),
  updatedAt: Type.Any(),
})

export const listRequestsSchema = {
  tags: ['requests'],
  response: {
    200: Type.Object({
      data: Type.Array(RequestSchema),
    }),
  },
}

export const getRequestSchema = {
  tags: ['requests'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: Type.Object({
      data: RequestSchema,
    }),
  },
}

export const updateRequestStatusSchema = {
  tags: ['requests'],
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    status: Type.String(),
  }),
  response: {
    200: Type.Object({
      data: RequestSchema,
    }),
  },
}

export const convertRequestSchema = {
  tags: ['requests'],
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    recipientName: Type.Optional(Type.String()),
    recipientPhone: Type.Optional(Type.String()),
    deliveryAddress: Type.Optional(Type.String()),
    deliveryTime: Type.Optional(Type.String()),
    postcardText: Type.Optional(Type.String()),
    comment: Type.Optional(Type.String()),
    wishes: Type.Optional(Type.String()),
    budget: Type.Number(),
  }),
  response: {
    200: Type.Object({
      success: Type.Boolean(),
      orderId: Type.String(),
    }),
  },
}
