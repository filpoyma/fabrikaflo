import type { FastifyRequest, FastifyReply } from 'fastify'
import { createTeamService } from './service.ts'

export async function listTeam(request: FastifyRequest) {
  const service = createTeamService(request.server)
  const data = await service.getAllMembers()
  return { data }
}

export async function createTeamMember(
  request: FastifyRequest<{
    Body: {
      name: string
      tgname?: string
      login?: string
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

export async function updateTeamMember(
  request: FastifyRequest<{
    Params: { id: string }
    Body: {
      name: string
      tgname?: string
      login?: string
      phone?: string
      role: 'ADMIN' | 'COURIER'
      password?: string
    }
  }>,
) {
  const service = createTeamService(request.server)
  const data = await service.updateMember(request.params.id, request.body)
  return { data }
}

export async function uploadTeamMemberAvatar(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const parts = request.parts()
  let fileBuffer: Buffer | null = null

  for await (const part of parts) {
    if (part.type === 'file') {
      fileBuffer = await part.toBuffer()
    }
  }

  if (!fileBuffer) {
    return reply.badRequest('No file uploaded')
  }

  // Upload to Cloudinary
  const avatarUrl = await request.server.cloudinary.uploadBuffer(fileBuffer, 'fabrikaflo_avatars')

  const service = createTeamService(request.server)
  const data = await service.updateAvatar(request.params.id, avatarUrl)

  return { data }
}

export async function deleteTeamMember(request: FastifyRequest<{ Params: { id: string } }>) {
  const service = createTeamService(request.server)
  return service.deleteMember(request.params.id)
}
