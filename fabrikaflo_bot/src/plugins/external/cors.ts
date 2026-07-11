import fp from 'fastify-plugin'
import cors from '@fastify/cors'

export default fp(
  async function corsPlugin(fastify) {
    const origins = fastify.config.CORS_ORIGINS.split(',').map((o) => o.trim().replace(/\/$/, ''))
    await fastify.register(cors, {
      origin: origins.includes('*') ? true : origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  },
  { name: 'cors', dependencies: ['env'] },
)
