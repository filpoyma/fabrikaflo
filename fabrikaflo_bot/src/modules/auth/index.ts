import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authRoutes } from './routes.ts'

const auth: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.register(authRoutes)
}

export default auth
