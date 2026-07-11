import type { FastifyRequest, FastifyReply } from 'fastify'
import { createAuthService } from './service.ts'

export async function login(
  request: FastifyRequest<{ Body: { username: string; password: string } }>,
  _reply: FastifyReply,
) {
  const service = createAuthService(request.server)
  const { username, password } = request.body
  return service.login(username, password)
}

export async function getMe(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  return { user: request.user }
}
