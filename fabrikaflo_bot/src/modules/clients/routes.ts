import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import * as handlers from './handlers.ts'
import * as schema from './schema.ts'

export const clientsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    { schema: schema.listClientsSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.listClients,
  )
  fastify.get(
    '/couriers',
    { schema: schema.listCouriersSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.listCouriers,
  )
  fastify.get(
    '/profile',
    { schema: schema.profileSchema, preHandler: [fastify.authenticate] },
    handlers.getProfile,
  )
  fastify.patch(
    '/profile',
    { schema: schema.updateProfileSchema, preHandler: [fastify.authenticate] },
    handlers.updateProfile,
  )
}

export default clientsRoutes
