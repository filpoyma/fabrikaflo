import type { FastifyRequest, FastifyReply } from 'fastify'
import { createRequestsService } from './service.ts'

export async function listRequests(request: FastifyRequest, _reply: FastifyReply) {
  const service = createRequestsService(request.server)
  const data = await service.getAll()
  return { data }
}

export async function getRequest(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) {
  const service = createRequestsService(request.server)
  const data = await service.getById(request.params.id)
  return { data }
}

export async function updateRequestStatus(
  request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
  _reply: FastifyReply,
) {
  const service = createRequestsService(request.server)
  const data = await service.updateStatus(request.params.id, request.body.status)
  return { data }
}

export async function convertRequest(
  request: FastifyRequest<{
    Params: { id: string }
    Body: {
      recipientName?: string
      recipientPhone?: string
      deliveryAddress?: string
      deliveryTime?: string
      postcardText?: string
      comment?: string
      wishes?: string
      budget: number
    }
  }>,
  _reply: FastifyReply,
) {
  const service = createRequestsService(request.server)
  return service.convertToOrder(request.params.id, request.body)
}

export async function createRequest(
  request: FastifyRequest<{
    Body: {
      occasion: string
      budget: number
      date?: string | null
      deliveryType: string
      deliveryAddress?: string | null
      recipientPhone?: string | null
      postcardText?: string | null
      comment?: string | null
      examplePhotoUrl?: string | null
    }
  }>,
  reply: FastifyReply,
) {
  const service = createRequestsService(request.server)
  const data = await service.create(request.user.id, request.body)
  return reply.code(201).send({ data })
}

export async function uploadRequestPhoto(request: FastifyRequest, reply: FastifyReply) {
  const fileData = await request.file()
  if (!fileData) {
    return reply.badRequest('No file uploaded')
  }

  const buffer = await fileData.toBuffer()
  const url = await request.server.cloudinary.uploadBuffer(buffer, 'fabrikaflo_examples')
  return { url }
}
