import type { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../../lib/errors.ts'
import { createAuthService } from './service.ts'
import {
  assertTrustedOrigin,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from './cookies.ts'
import { toPublicUser } from './serialize.ts'

export async function login(
  request: FastifyRequest<{ Body: { login: string; password: string } }>,
  reply: FastifyReply,
) {
  const service = createAuthService(request.server)
  const { login, password } = request.body
  const result = await service.login(login, password)

  setRefreshTokenCookie(
    reply,
    request.server.config,
    result.refreshToken,
    result.refreshTokenExpiresAt,
  )

  return {
    accessToken: result.accessToken,
    user: result.user,
  }
}

export async function refresh(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    assertTrustedOrigin(request, request.server.config)
  } catch {
    throw new UnauthorizedError('Untrusted origin')
  }

  const rawToken = getRefreshTokenFromRequest(request, request.server.config)
  if (!rawToken) {
    throw new UnauthorizedError('Refresh token missing')
  }

  const service = createAuthService(request.server)
  const result = await service.refresh(rawToken)

  setRefreshTokenCookie(
    reply,
    request.server.config,
    result.refreshToken,
    result.refreshTokenExpiresAt,
  )

  return {
    accessToken: result.accessToken,
    user: result.user,
  }
}

export async function logout(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    assertTrustedOrigin(request, request.server.config)
  } catch {
    throw new UnauthorizedError('Untrusted origin')
  }

  const rawToken = getRefreshTokenFromRequest(request, request.server.config)
  const service = createAuthService(request.server)
  await service.logout(rawToken)

  clearRefreshTokenCookie(reply, request.server.config)

  return { ok: true }
}

export async function getMe(request: FastifyRequest) {
  return { user: toPublicUser(request.user) }
}
