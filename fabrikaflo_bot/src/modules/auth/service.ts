import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../../lib/errors.ts'

export function createAuthService(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  return {
    async login(login: string, checkPass: string) {
      const user = await prisma.user.findFirst({
        where: { login: login.trim(), role: 'ADMIN' },
      })

      if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid credentials')
      

      const isMatch = await bcrypt.compare(checkPass, user.passwordHash)
      if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials')
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        fastify.config.JWT_SECRET,
        { expiresIn: '30d' },
      )

      return { token, user }
    },
  }
}
