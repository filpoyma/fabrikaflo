import fp from 'fastify-plugin'
import { loadConfig, type Config } from '../../config.ts'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
  }
}

export type { Config }

export default fp(
  async function env(fastify) {
    fastify.decorate('config', loadConfig())
  },
  { name: 'env' },
)
