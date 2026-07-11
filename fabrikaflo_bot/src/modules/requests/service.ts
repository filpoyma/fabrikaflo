import type { FastifyInstance } from 'fastify'
import { NotFoundError } from '../../lib/errors.ts'

export function createRequestsService(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  return {
    async getAll() {
      return prisma.request.findMany({
        orderBy: { createdAt: 'desc' },
        include: { client: true },
      })
    },

    async getById(id: string) {
      const request = await prisma.request.findUnique({
        where: { id },
        include: { client: true },
      })
      if (!request) throw new NotFoundError('Request')
      return request
    },

    async updateStatus(id: string, status: any) {
      const request = await prisma.request.findUnique({ where: { id } })
      if (!request) throw new NotFoundError('Request')

      return prisma.request.update({
        where: { id },
        data: { status },
        include: { client: true },
      })
    },

    async convertToOrder(
      id: string,
      orderData: {
        recipientName?: string
        recipientPhone?: string
        deliveryAddress?: string
        deliveryTime?: string
        postcardText?: string
        comment?: string
        wishes?: string
        budget: number
      },
    ) {
      const request = await prisma.request.findUnique({
        where: { id },
        include: { client: true },
      })
      if (!request) throw new NotFoundError('Request')

      const time = orderData.deliveryTime ? new Date(orderData.deliveryTime) : null

      // Create Order
      const order = await prisma.order.create({
        data: {
          clientId: request.clientId,
          requestId: request.id,
          recipientName: orderData.recipientName ?? request.client.name,
          recipientPhone: orderData.recipientPhone ?? request.client.phone,
          deliveryAddress: orderData.deliveryAddress,
          deliveryTime: time,
          budget: orderData.budget,
          wishes: orderData.wishes || request.comment,
          postcardText: orderData.postcardText,
          comment: orderData.comment,
          status: 'CREATED',
        },
      })

      // Update Request status to CONVERTED
      await prisma.request.update({
        where: { id },
        data: { status: 'CONVERTED' },
      })

      // Notify Client in Telegram
      if (request.client.telegramId) {
        await fastify.sendBotNotification(
          request.client.telegramId,
          `🌸 *Ваш заказ оформлен!*\n\n` +
            `Мы создали заказ по вашей заявке.\n` +
            `• Сумма: *${order.budget} руб.*\n` +
            `• Пожелания: _${order.wishes || 'авторский оригинальный букет'}_\n\n` +
            `Флорист приступает к сборке! Как только букет будет готов, мы пришлем вам фото для подтверждения.`,
        )
      }

      return { success: true, orderId: order.id }
    },
  }
}
