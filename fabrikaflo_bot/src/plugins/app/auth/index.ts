import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import type { User } from '../../../generated/prisma/client.ts'
import { UnauthorizedError, ForbiddenError } from '../../../lib/errors.ts'

declare module 'fastify' {
  interface FastifyRequest {
    user: User
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

interface JwtPayload {
  userId: string
  role: string
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers['authorization']
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError()
      }

      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, fastify.config.JWT_SECRET) as JwtPayload
        const user = await fastify.prisma.user.findUnique({
          where: { id: decoded.userId },
        })

        if (!user) {
          throw new UnauthorizedError()
        }

        request.user = user
      } catch (err) {
        throw new UnauthorizedError()
      }
    })

    fastify.decorate('requireAdmin', async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!request.user) {
        throw new UnauthorizedError()
      }
      if (request.user.role !== 'ADMIN') {
        throw new ForbiddenError('Admin access required')
      }
    })
  },
  {
    name: 'auth',
    dependencies: ['prisma', 'env'],
  },
)
