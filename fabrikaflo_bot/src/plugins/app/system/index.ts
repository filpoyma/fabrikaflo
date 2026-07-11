import type { FastifyInstance } from 'fastify'

export default async function systemRoutes(fastify: FastifyInstance) {
  // Root welcome
  fastify.get('/', async () => {
    return { service: 'fabrikaflo-bot', status: 'ok' }
  })

  // Database readiness health check
  fastify.get('/health', async (_request, reply) => {
    try {
      await fastify.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', database: 'up' }
    } catch (err) {
      fastify.log.error(err, 'database health check failed')
      return reply.serviceUnavailable('database unavailable')
    }
  })
}
