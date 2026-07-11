import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { NotFoundError, ValidationError } from '../../lib/errors.ts'

export function createTeamService(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  return {
    async getAllMembers() {
      return prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'COURIER'] },
        },
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          role: true,
          telegramId: true,
          createdAt: true,
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      })
    },

    async createMember(data: {
      name: string
      username?: string
      phone?: string
      role: 'ADMIN' | 'COURIER'
      password?: string
    }) {
      if (data.role === 'ADMIN' && !data.password) {
        throw new ValidationError('Пароль обязателен для администратора')
      }

      // Sanitize username: remove leading @
      const username = data.username?.replace(/^@/, '').trim() || null

      const passwordHash =
        data.role === 'ADMIN' && data.password
          ? await bcrypt.hash(data.password, 10)
          : null

      // If user with this username already exists — reassign their role
      if (username) {
        const existing = await prisma.user.findFirst({ where: { username } })
        if (existing) {
          return prisma.user.update({
            where: { id: existing.id },
            data: {
              role: data.role,
              name: data.name,
              phone: data.phone || existing.phone,
              ...(passwordHash ? { passwordHash } : {}),
            },
            select: {
              id: true,
              name: true,
              username: true,
              phone: true,
              role: true,
              telegramId: true,
              createdAt: true,
            },
          })
        }
      }

      return prisma.user.create({
        data: {
          name: data.name,
          username,
          phone: data.phone || null,
          role: data.role,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          role: true,
          telegramId: true,
          createdAt: true,
        },
      })
    },

    async deleteMember(id: string) {
      const member = await prisma.user.findUnique({ where: { id } })
      if (!member) throw new NotFoundError('Сотрудник')
      if (member.role === 'CLIENT') throw new ValidationError('Нельзя удалить обычного клиента из этого раздела')

      await prisma.user.delete({ where: { id } })
      return { success: true }
    },
  }
}
