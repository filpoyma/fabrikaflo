import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../../lib/errors.ts'

export function createAuthService(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  return {
    async login(username: string, checkPass: string) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { phone: username },
          ],
          role: 'ADMIN', // React Dashboard is only accessible by administrators
        },
      })

      if (!user || !user.passwordHash) {
        throw new UnauthorizedError('Invalid credentials')
      }

      const isMatch = await bcrypt.compare(checkPass, user.passwordHash)
      if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials')
      }

      // Generate a signed JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        fastify.config.JWT_SECRET,
        { expiresIn: '30d' },
      )

      return { token, user }
    },
  }
}
