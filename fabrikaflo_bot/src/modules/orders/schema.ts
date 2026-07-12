import { Type } from '@sinclair/typebox'
import { UserSchema } from '../auth/schema.ts'
import { RequestSchema } from '../requests/schema.ts'

export const OrderPhotoSchema = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  photoUrl: Type.String(),
  createdAt: Type.Any(),
})

export const OrderSchema = Type.Object({
  id: Type.String(),
  clientId: Type.String(),
  client: Type.Optional(UserSchema),
  requestId: Type.Union([Type.String(), Type.Null()]),
  request: Type.Optional(Type.Union([RequestSchema, Type.Null()])),
  recipientName: Type.Union([Type.String(), Type.Null()]),
  recipientPhone: Type.Union([Type.String(), Type.Null()]),
  deliveryAddress: Type.Union([Type.String(), Type.Null()]),
  deliveryTime: Type.Union([Type.Any(), Type.Null()]),
  budget: Type.Number(),
  wishes: Type.Union([Type.String(), Type.Null()]),
  postcardText: Type.Union([Type.String(), Type.Null()]),
  comment: Type.Union([Type.String(), Type.Null()]),
  clientFeedback: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  paymentLink: Type.Union([Type.String(), Type.Null()]),
  courierId: Type.Union([Type.String(), Type.Null()]),
  courier: Type.Optional(Type.Union([UserSchema, Type.Null()])),
  createdAt: Type.Any(),
  updatedAt: Type.Any(),
  photos: Type.Optional(Type.Array(OrderPhotoSchema)),
})

export const listOrdersSchema = {
  tags: ['orders'],
  response: {
    200: Type.Object({
      data: Type.Array(OrderSchema),
    }),
  },
}

export const getOrderSchema = {
  tags: ['orders'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: Type.Object({
      data: OrderSchema,
    }),
  },
}

export const createOrderSchema = {
  tags: ['orders'],
  body: Type.Object({
    clientId: Type.String(),
    recipientName: Type.Optional(Type.String()),
    recipientPhone: Type.Optional(Type.String()),
    deliveryAddress: Type.Optional(Type.String()),
    deliveryTime: Type.Optional(Type.String()),
    budget: Type.Number(),
    wishes: Type.Optional(Type.String()),
    postcardText: Type.Optional(Type.String()),
    comment: Type.Optional(Type.String()),
  }),
  response: {
    201: Type.Object({
      data: OrderSchema,
    }),
  },
}

export const updateOrderStatusSchema = {
  tags: ['orders'],
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    status: Type.String(),
  }),
  response: {
    200: Type.Object({
      data: OrderSchema,
    }),
  },
}

export const sendApprovalSchema = {
  tags: ['orders'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: Type.Object({
      success: Type.Boolean(),
      status: Type.String(),
    }),
  },
}

export const sendPaymentSchema = {
  tags: ['orders'],
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    paymentLink: Type.String(),
  }),
  response: {
    200: Type.Object({
      success: Type.Boolean(),
      status: Type.String(),
    }),
  },
}

export const assignCourierSchema = {
  tags: ['orders'],
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    courierId: Type.String(),
  }),
  response: {
    200: Type.Object({
      success: Type.Boolean(),
      status: Type.String(),
    }),
  },
}

export const uploadPhotoSchema = {
  tags: ['orders'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: Type.Object({
      data: OrderSchema,
    }),
  },
}
