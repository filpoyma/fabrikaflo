import type { FastifyRequest, FastifyReply } from 'fastify'
import { createOrdersService } from './service.ts'

export async function listOrders(request: FastifyRequest, _reply: FastifyReply) {
  const service = createOrdersService(request.server)
  const data = await service.getAll()
  return { data }
}

export async function getOrder(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  const data = await service.getById(request.params.id)
  return { data }
}

export async function createOrder(
  request: FastifyRequest<{
    Body: {
      clientId: string
      recipientName?: string
      recipientPhone?: string
      deliveryAddress?: string
      deliveryTime?: string
      budget: number
      wishes?: string
      postcardText?: string
      comment?: string
    }
  }>,
  reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  const data = await service.createDirect(request.body)
  return reply.code(201).send({ data })
}

export async function updateOrderStatus(
  request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  const data = await service.updateStatus(request.params.id, request.body.status)
  return { data }
}

export async function uploadPhoto(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const fileData = await request.file()
  if (!fileData) {
    return reply.badRequest('No file uploaded')
  }

  const buffer = await fileData.toBuffer()
  const service = createOrdersService(request.server)

  // Upload buffer to Cloudinary
  const photoUrl = await request.server.cloudinary.uploadBuffer(buffer, 'fabrikaflo_bouquets')
  const data = await service.addPhoto(request.params.id, photoUrl)

  return { data }
}

export async function sendApproval(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  return service.sendPhotoForApproval(request.params.id)
}

export async function sendPayment(
  request: FastifyRequest<{ Params: { id: string }; Body: { paymentLink: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  return service.sendPaymentLink(request.params.id, request.body.paymentLink)
}

export async function assignCourier(
  request: FastifyRequest<{ Params: { id: string }; Body: { courierId: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  return service.assignCourier(request.params.id, request.body.courierId)
}

export async function listMyOrders(request: FastifyRequest, _reply: FastifyReply) {
  const service = createOrdersService(request.server)
  const data = await service.getMyOrders(request.user.id)
  return { data }
}

export async function clientGetOrder(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  const data = await service.clientGetById(request.params.id, request.user.id)
  return { data }
}

export async function clientApproveOrder(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  return service.clientApproveOrder(request.params.id, request.user.id)
}

export async function clientDisapproveOrder(
  request: FastifyRequest<{ Params: { id: string }; Body: { feedback: string } }>,
  _reply: FastifyReply,
) {
  const service = createOrdersService(request.server)
  return service.clientDisapproveOrder(request.params.id, request.user.id, request.body.feedback)
}

export async function clientUploadReceipt(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const fileData = await request.file()
  if (!fileData) {
    return reply.badRequest('No file uploaded')
  }

  const buffer = await fileData.toBuffer()
  const service = createOrdersService(request.server)

  const photoUrl = await request.server.cloudinary.uploadBuffer(buffer, 'fabrikaflo_receipts')
  await service.clientUploadReceipt(request.params.id, photoUrl, request.user.id)

  return { success: true }
}
