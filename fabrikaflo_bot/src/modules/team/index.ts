import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { teamRoutes } from './routes.ts'

const team: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.register(teamRoutes)
}

export default team
