import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import * as handlers from './handlers.ts'
import * as schema from './schema.ts'

export const requestsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    { schema: schema.listRequestsSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.listRequests,
  )
  fastify.post(
    '/',
    { schema: schema.createRequestSchema, preHandler: [fastify.authenticate] },
    handlers.createRequest,
  )
  fastify.post(
    '/upload',
    { schema: schema.uploadRequestPhotoSchema, preHandler: [fastify.authenticate] },
    handlers.uploadRequestPhoto,
  )
  fastify.get(
    '/:id',
    { schema: schema.getRequestSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.getRequest,
  )
  fastify.put(
    '/:id/status',
    { schema: schema.updateRequestStatusSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.updateRequestStatus,
  )
  fastify.post(
    '/:id/convert',
    { schema: schema.convertRequestSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.convertRequest,
  )
}

export default requestsRoutes
