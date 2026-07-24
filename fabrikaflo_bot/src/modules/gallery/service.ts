import type { FastifyInstance } from 'fastify'
import { NotFoundError } from '../../lib/errors.ts'

export function createGalleryService(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  return {
    async getAll() {
      return prisma.portfolioItem.findMany({
        orderBy: { createdAt: 'desc' },
      })
    },

    async getById(id: string) {
      const item = await prisma.portfolioItem.findUnique({ where: { id } })
      if (!item) throw new NotFoundError('Portfolio item')
      return item
    },

    async createItem(photoUrl: string, title?: string, description?: string) {
      return prisma.portfolioItem.create({
        data: {
          photoUrl,
          title: title || null,
          description: description || null,
        }
      })
    },

    async deleteItem(id: string) {
      const item = await prisma.portfolioItem.findUnique({ where: { id } })
      if (!item) throw new NotFoundError('Portfolio item')

      await prisma.portfolioItem.delete({ where: { id } })
      return { success: true }
    },

    async updateItem(id: string, title?: string, description?: string, photoUrl?: string) {
      const item = await prisma.portfolioItem.findUnique({ where: { id } })
      if (!item) throw new NotFoundError('Portfolio item')

      return prisma.portfolioItem.update({
        where: { id },
        data: {
          title: title !== undefined ? (title || null) : undefined,
          description: description !== undefined ? (description || null) : undefined,
          photoUrl: photoUrl !== undefined ? photoUrl : undefined,
        },
      })
    },
  }
}
