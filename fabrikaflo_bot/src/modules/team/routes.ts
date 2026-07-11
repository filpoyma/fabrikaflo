import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import * as handlers from './handlers.ts'
import * as schema from './schema.ts'

export const teamRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    { schema: schema.listTeamSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.listTeam,
  )
  fastify.post(
    '/',
    { schema: schema.createTeamSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.createTeamMember,
  )
  fastify.delete(
    '/:id',
    { schema: schema.deleteTeamSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.deleteTeamMember,
  )
}

export default teamRoutes
