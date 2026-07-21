import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'node:crypto'
import type { User } from '../../../generated/prisma/client.ts'
import { UnauthorizedError, ForbiddenError } from '../../../lib/errors.ts'
import { verifyAccessToken } from '../../../modules/auth/tokens.ts'

declare module 'fastify' {
  interface FastifyRequest {
    user: User
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

interface JwtPayload {
  userId: string
  role: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function verifyTelegramInitData(initData: string, botToken: string): Record<string, unknown> | null {
  if (!initData) return null
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    const sortedKeys = Array.from(params.keys())
      .filter((k) => k !== 'hash')
      .sort()

    const dataCheckString = sortedKeys
      .map((k) => `${k}=${params.get(k)}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (expectedHash === hash) {
      const userJson = params.get('user')
      if (userJson) {
        return JSON.parse(userJson)
      }
    }
  } catch {
    // Ignore
  }
  return null
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate('authenticate', async (request: FastifyRequest) => {
      // 1. Check X-Init-Data header first (Telegram Mini App)
      const initDataHeader = request.headers['x-init-data'] as string
      if (initDataHeader) {
        const tgUser = verifyTelegramInitData(initDataHeader, fastify.config.TELEGRAM_BOT_TOKEN)
        if (tgUser && tgUser.id) {
          const telegramId = String(tgUser.id)
          const tgUsername = asString(tgUser.username)
          const tgFirst = asString(tgUser.first_name)
          const tgLast = asString(tgUser.last_name)
          let user = await fastify.prisma.user.findUnique({
            where: { telegramId },
          })
          if (!user) {
            user = await fastify.prisma.user.create({
              data: {
                telegramId,
                tgname: tgUsername,
                name: [tgFirst, tgLast].filter(Boolean).join(' ') || 'Client',
                role: 'CLIENT',
              },
            })
          } else if (user.tgname !== (tgUsername || null)) {
            user = await fastify.prisma.user.update({
              where: { id: user.id },
              data: { tgname: tgUsername || null },
            })
          }
          request.user = user
          return
        }
      }

      // 2. Fallback to Bearer JWT (Dashboard Admin / API calls)
      const authHeader = request.headers['authorization']
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError()
      }

      const token = authHeader.substring(7)
      try {
        const decoded = verifyAccessToken(token, fastify.config) as JwtPayload
        const user = await fastify.prisma.user.findUnique({
          where: { id: decoded.userId },
        })

        if (!user) {
          throw new UnauthorizedError()
        }

        request.user = user
      } catch {
        throw new UnauthorizedError()
      }
    })

    fastify.decorate('requireAdmin', async (request: FastifyRequest) => {
      if (!request.user) {
        throw new UnauthorizedError()
      }
      if (request.user.role !== 'ADMIN') {
        throw new ForbiddenError('Admin access required')
      }
    })
  },
  {
    name: 'auth',
    dependencies: ['prisma', 'env'],
  },
)
