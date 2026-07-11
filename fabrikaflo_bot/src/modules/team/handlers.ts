import type { FastifyRequest, FastifyReply } from 'fastify'
import { createTeamService } from './service.ts'

export async function listTeam(request: FastifyRequest, _reply: FastifyReply) {
  const service = createTeamService(request.server)
  const data = await service.getAllMembers()
  return { data }
}

export async function createTeamMember(
  request: FastifyRequest<{
    Body: {
      name: string
      username?: string
      phone?: string
      role: 'ADMIN' | 'COURIER'
      password?: string
    }
  }>,
  reply: FastifyReply,
) {
  const service = createTeamService(request.server)
  const data = await service.createMember(request.body)
  return reply.code(201).send({ data })
}

export async function deleteTeamMember(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) {
  const service = createTeamService(request.server)
  return service.deleteMember(request.params.id)
}
