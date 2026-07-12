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
  fastify.put(
    '/:id',
    { schema: schema.updateTeamSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.updateTeamMember,
  )
  fastify.post(
    '/:id/avatar',
    { schema: schema.uploadAvatarSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.uploadTeamMemberAvatar,
  )
  fastify.delete(
    '/:id',
    { schema: schema.deleteTeamSchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.deleteTeamMember,
  )
}

export default teamRoutes
