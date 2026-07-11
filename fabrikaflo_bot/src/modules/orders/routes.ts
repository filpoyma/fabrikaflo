import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import * as handlers from './handlers.ts'
import * as schema from './schema.ts'

export const ordersRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    { schema: schema.listOrdersSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.listOrders,
  )
  fastify.get(
    '/:id',
    { schema: schema.getOrderSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.getOrder,
  )
  fastify.post(
    '/',
    { schema: schema.createOrderSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.createOrder,
  )
  fastify.put(
    '/:id/status',
    { schema: schema.updateOrderStatusSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.updateOrderStatus,
  )

  // Multipart photo upload
  fastify.post(
    '/:id/photos',
    { schema: schema.uploadPhotoSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.uploadPhoto,
  )

  fastify.post(
    '/:id/send-approval',
    { schema: schema.sendApprovalSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.sendApproval,
  )
  fastify.post(
    '/:id/send-payment',
    { schema: schema.sendPaymentSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.sendPayment,
  )
  fastify.post(
    '/:id/assign-courier',
    { schema: schema.assignCourierSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.assignCourier,
  )
}

export default ordersRoutes
