import type { FastifyRequest, FastifyReply } from 'fastify'
import { createClientsService } from './service.ts'

export async function listClients(request: FastifyRequest, _reply: FastifyReply) {
  const service = createClientsService(request.server)
  const data = await service.getClientsCRM()
  return { data }
}

export async function listCouriers(request: FastifyRequest, _reply: FastifyReply) {
  const service = createClientsService(request.server)
  const data = await service.getCouriers()
  return { data }
}
