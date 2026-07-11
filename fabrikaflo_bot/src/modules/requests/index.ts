import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { requestsRoutes } from './routes.ts'

const requests: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.register(requestsRoutes)
}

export default requests
