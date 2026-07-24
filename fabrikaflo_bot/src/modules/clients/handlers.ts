import type { FastifyRequest, FastifyReply } from 'fastify'
import { createClientsService } from './service.ts'

export async function listClients(request: FastifyRequest) {
  const service = createClientsService(request.server)
  const data = await service.getClientsCRM()
  return { data }
}

export async function listCouriers(request: FastifyRequest) {
  const service = createClientsService(request.server)
  const data = await service.getCouriers()
  return { data }
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const service = createClientsService(request.server)
  const data = await service.getProfile(request.user.id)
  if (!data) return reply.notFound('Profile not found')
  return { data }
}

export async function updateProfile(
  request: FastifyRequest<{
    Body: {
      name?: string
      phone?: string
      avatarUrl?: string
      address?: string
    }
  }>,
) {
  const service = createClientsService(request.server)
  const data = await service.updateProfile(request.user.id, request.body)
  return { data }
}
