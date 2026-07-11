import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'

export default fp(
  async function helmetPlugin(fastify) {
    await fastify.register(helmet, {
      contentSecurityPolicy: false, // Disable CSP for easier integration with React and local resources
    })
  },
  { name: 'helmet' },
)
