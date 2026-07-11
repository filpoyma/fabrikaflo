import fp from 'fastify-plugin'
import multipart from '@fastify/multipart'

export default fp(
  async function multipartPlugin(fastify) {
    await fastify.register(multipart, {
      limits: {
        fieldNameSize: 100,
        fieldSize: 1024 * 1024 * 5, // 5MB for text fields
        fields: 20,
        fileSize: 1024 * 1024 * 20, // 20MB for images
        files: 5,
      },
    })
  },
  { name: 'multipart' },
)
