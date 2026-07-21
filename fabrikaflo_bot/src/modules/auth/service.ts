import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { UnauthorizedError } from '../../lib/errors.ts'
import { toPublicUser } from './serialize.ts'
import {
  createRefreshTokenValue,
  getRefreshTokenExpiry,
  hashRefreshToken,
  signAccessToken,
} from './tokens.ts'

type AuthSession = {
  accessToken: string
  user: ReturnType<typeof toPublicUser>
}

export function createAuthService(fastify: FastifyInstance) {
  const prisma = fastify.prisma
  const config = fastify.config

  async function issueSession(userId: string): Promise<AuthSession> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedError()
    }

    const accessToken = signAccessToken(
      { userId: user.id, role: user.role },
      config,
    )

    return {
      accessToken,
      user: toPublicUser(user),
    }
  }

  async function createRefreshToken(userId: string) {
    const rawToken = createRefreshTokenValue()
    const tokenHash = hashRefreshToken(rawToken)
    const familyId = randomUUID()
    const expiresAt = getRefreshTokenExpiry(config)

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt,
      },
    })

    return { rawToken, expiresAt }
  }

  async function revokeFamily(familyId: string) {
    await prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  return {
    async login(login: string, checkPass: string) {
      const user = await prisma.user.findFirst({
        where: { login: login.trim(), role: 'ADMIN' },
      })

      if (!user || !user.passwordHash) {
        throw new UnauthorizedError('Invalid credentials')
      }

      const isMatch = await bcrypt.compare(checkPass, user.passwordHash)
      if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials')
      }

      const session = await issueSession(user.id)
      const refreshToken = await createRefreshToken(user.id)

      return {
        ...session,
        refreshToken: refreshToken.rawToken,
        refreshTokenExpiresAt: refreshToken.expiresAt,
      }
    },

    async refresh(rawToken: string) {
      const tokenHash = hashRefreshToken(rawToken)
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      })

      if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token')
      }

      if (storedToken.revokedAt) {
        await revokeFamily(storedToken.familyId)
        throw new UnauthorizedError('Refresh token reuse detected')
      }

      if (storedToken.expiresAt <= new Date()) {
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        })
        throw new UnauthorizedError('Refresh token expired')
      }

      const session = await issueSession(storedToken.userId)

      const nextRawToken = createRefreshTokenValue()
      const nextTokenHash = hashRefreshToken(nextRawToken)
      const expiresAt = getRefreshTokenExpiry(config)

      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        }),
        prisma.refreshToken.create({
          data: {
            userId: storedToken.userId,
            tokenHash: nextTokenHash,
            familyId: storedToken.familyId,
            expiresAt,
          },
        }),
      ])

      return {
        ...session,
        refreshToken: nextRawToken,
        refreshTokenExpiresAt: expiresAt,
      }
    },

    async logout(rawToken: string | null) {
      if (!rawToken) {
        return
      }

      const tokenHash = hashRefreshToken(rawToken)
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      })

      if (!storedToken || storedToken.revokedAt) {
        return
      }

      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      })
    },
  }
}
