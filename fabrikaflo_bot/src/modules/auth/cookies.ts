import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Config } from '../../config.ts'

const COOKIE_PATH = '/api/fabrika'

export function setRefreshTokenCookie(
  reply: FastifyReply,
  config: Config,
  token: string,
  expiresAt: Date,
) {
  reply.setCookie(config.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
    expires: expiresAt,
  })
}

export function clearRefreshTokenCookie(reply: FastifyReply, config: Config) {
  reply.clearCookie(config.REFRESH_COOKIE_NAME, {
    path: COOKIE_PATH,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}

export function getRefreshTokenFromRequest(
  request: FastifyRequest,
  config: Config,
): string | null {
  const token = request.cookies[config.REFRESH_COOKIE_NAME]
  return typeof token === 'string' && token.length > 0 ? token : null
}

export function assertTrustedOrigin(request: FastifyRequest, config: Config) {
  const allowedOrigins = config.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)

  if (allowedOrigins.includes('*')) {
    return
  }

  const origin = request.headers.origin
  const referer = request.headers.referer

  const requestOrigin = origin
    ? origin.replace(/\/$/, '')
    : referer
      ? new URL(referer).origin
      : null

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    throw new Error('Untrusted origin')
  }
}
