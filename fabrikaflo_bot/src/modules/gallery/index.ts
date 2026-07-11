import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { galleryRoutes } from './routes.ts'

const gallery: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.register(galleryRoutes)
}

export default gallery
