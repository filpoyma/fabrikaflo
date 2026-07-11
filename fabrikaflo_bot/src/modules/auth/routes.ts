import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import * as handlers from './handlers.ts'
import * as schema from './schema.ts'

export const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post('/login', { schema: schema.loginSchema }, handlers.login)
  fastify.get('/me', { schema: schema.getMeSchema, preHandler: [fastify.authenticate] }, handlers.getMe)
}

export default authRoutes
