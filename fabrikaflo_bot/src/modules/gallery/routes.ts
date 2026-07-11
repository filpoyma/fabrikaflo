import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import * as handlers from './handlers.ts'
import * as schema from './schema.ts'

export const galleryRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Publicly readable for bot display
  fastify.get('/', { schema: schema.listGallerySchema }, handlers.listGallery)
  
  // Restricted for admin management
  fastify.post(
    '/',
    { schema: schema.createGallerySchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.createGalleryItem,
  )
  fastify.delete(
    '/:id',
    { schema: schema.deleteGallerySchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.deleteGalleryItem,
  )
  fastify.put(
    '/:id',
    { schema: schema.updateGallerySchema, preHandler: [fastify.authenticate, fastify.requireAdmin] },
    handlers.updateGalleryItem,
  )
}

export default galleryRoutes
