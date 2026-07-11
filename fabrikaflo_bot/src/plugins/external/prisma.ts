import fp from 'fastify-plugin'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient } from '../../generated/prisma/client.ts'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export default fp(
  async function prisma(fastify) {
    // Correctly initialize pg Pool like in the reference project
    const pool = new pg.Pool({ connectionString: fastify.config.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    const client = new PrismaClient({ adapter })

    fastify.decorate('prisma', client)

    fastify.addHook('onClose', async (instance) => {
      await instance.prisma.$disconnect()
      await pool.end()
    })
  },
  { name: 'prisma', dependencies: ['env'] },
)
