import fp from 'fastify-plugin'

export default fp(
  async function accessLog(fastify) {
    fastify.addHook('onResponse', async (request, reply) => {
      request.log.info(
        `${request.method} ${request.url} ${reply.statusCode} ${Math.round(reply.elapsedTime)}ms`,
      )
    })
  },
  { name: 'access-log' },
)
