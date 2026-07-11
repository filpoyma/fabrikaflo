import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { clientsRoutes } from './routes.ts'

const clients: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.register(clientsRoutes)
}

export default clients
