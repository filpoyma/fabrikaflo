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
          tgname: true,
          login: true,
          phone: true,
          role: true,
          telegramId: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      })
    },

    async createMember(data: {
      name: string
      tgname?: string
      login?: string
      phone?: string
      role: 'ADMIN' | 'COURIER'
      password?: string
    }) {
      if (data.role === 'ADMIN' && !data.password) {
        throw new ValidationError('Пароль обязателен для администратора')
      }
      if (data.role === 'ADMIN' && !data.login) {
        throw new ValidationError('Логин обязателен для администратора')
      }

      // Sanitize tgname: remove leading @
      const tgname = data.tgname?.replace(/^@/, '').trim() || null
      // Sanitize login
      const login = data.login?.toLowerCase().trim() || null

      if (login) {
        const existing = await prisma.user.findFirst({ where: { login } })
        if (existing) {
          throw new ValidationError('Сотрудник с таким логином уже существует')
        }
      }

      const passwordHash =
        data.role === 'ADMIN' && data.password
          ? await bcrypt.hash(data.password, 10)
          : null

      // If user with this tgname already exists — reassign their role
      if (tgname) {
        const existing = await prisma.user.findFirst({ where: { tgname } })
        if (existing) {
          return prisma.user.update({
            where: { id: existing.id },
            data: {
              role: data.role,
              name: data.name,
              login,
              phone: data.phone || existing.phone,
              ...(passwordHash ? { passwordHash } : {}),
            },
            select: {
              id: true,
              name: true,
              tgname: true,
              login: true,
              phone: true,
              role: true,
              telegramId: true,
              avatarUrl: true,
              createdAt: true,
            },
          })
        }
      }

      return prisma.user.create({
        data: {
          name: data.name,
          tgname,
          login,
          phone: data.phone || null,
          role: data.role,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          tgname: true,
          login: true,
          phone: true,
          role: true,
          telegramId: true,
          avatarUrl: true,
          createdAt: true,
        },
      })
    },

    async updateMember(
      id: string,
      data: {
        name: string
        tgname?: string
        login?: string
        phone?: string
        role: 'ADMIN' | 'COURIER'
        password?: string
      }
    ) {
      const existingUser = await prisma.user.findUnique({ where: { id } })
      if (!existingUser) throw new NotFoundError('Сотрудник')
      if (existingUser.role === 'CLIENT') {
        throw new ValidationError('Нельзя редактировать обычного клиента из этого раздела')
      }

      if (data.role === 'ADMIN' && !data.login && !existingUser.login) {
        throw new ValidationError('Логин обязателен для администратора')
      }

      // Sanitize tgname
      const tgname = data.tgname?.replace(/^@/, '').trim() || null
      // Sanitize login
      const login = data.role === 'ADMIN' ? (data.login?.toLowerCase().trim() || null) : null

      if (login && login !== existingUser.login) {
        const conflict = await prisma.user.findFirst({ where: { login } })
        if (conflict) {
          throw new ValidationError('Сотрудник с таким логином уже существует')
        }
      }

      let passwordHash = existingUser.passwordHash
      if (data.role === 'ADMIN') {
        if (data.password && data.password.trim() !== '') {
          passwordHash = await bcrypt.hash(data.password, 10)
        } else if (!existingUser.passwordHash) {
          throw new ValidationError('Пароль обязателен для администратора')
        }
      } else {
        passwordHash = null
      }

      return prisma.user.update({
        where: { id },
        data: {
          name: data.name,
          tgname,
          login,
          phone: data.phone || null,
          role: data.role,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          tgname: true,
          login: true,
          phone: true,
          role: true,
          telegramId: true,
          avatarUrl: true,
          createdAt: true,
        },
      })
    },

    async updateAvatar(id: string, avatarUrl: string) {
      const existingUser = await prisma.user.findUnique({ where: { id } })
      if (!existingUser) throw new NotFoundError('Сотрудник')
      if (existingUser.role === 'CLIENT') {
        throw new ValidationError('Нельзя редактировать обычного клиента из этого раздела')
      }

      return prisma.user.update({
        where: { id },
        data: { avatarUrl },
        select: {
          id: true,
          name: true,
          tgname: true,
          login: true,
          phone: true,
          role: true,
          telegramId: true,
          avatarUrl: true,
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
