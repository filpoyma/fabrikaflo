import type { FastifyInstance } from 'fastify'
import { NotFoundError, ValidationError } from '../../lib/errors.ts'

export function createOrdersService(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  return {
    async getAll() {
      return prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { client: true, courier: true, photos: true },
      })
    },

    async getById(id: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true, courier: true, photos: true },
      })
      if (!order) throw new NotFoundError('Order')
      return order
    },

    async createDirect(data: {
      clientId: string
      recipientName?: string
      recipientPhone?: string
      deliveryAddress?: string
      deliveryTime?: string
      budget: number
      wishes?: string
      postcardText?: string
      comment?: string
    }) {
      const client = await prisma.user.findUnique({ where: { id: data.clientId } })
      if (!client) throw new NotFoundError('Client user')

      const time = data.deliveryTime ? new Date(data.deliveryTime) : null

      const order = await prisma.order.create({
        data: {
          clientId: data.clientId,
          recipientName: data.recipientName ?? client.name,
          recipientPhone: data.recipientPhone ?? client.phone,
          deliveryAddress: data.deliveryAddress,
          deliveryTime: time,
          budget: data.budget,
          wishes: data.wishes,
          postcardText: data.postcardText,
          comment: data.comment,
          status: 'CREATED',
        },
        include: { client: true, courier: true, photos: true },
      })

      // Notify Client in Telegram
      if (client.telegramId) {
        await fastify.sendBotNotification(
          client.telegramId,
          `🌸 *Создан новый заказ!*\n\n` +
            `Администратор оформил заказ для вас.\n` +
            `• Сумма: *${order.budget} (руб.)*\n` +
            `• Пожелания: _${order.wishes || 'оригинальный букет'}_\n\n` +
            `Флорист уже приступает к сборке! ✨`
        )
      }

      return order
    },

    async updateStatus(id: string, status: any) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      })
      if (!order) throw new NotFoundError('Order')

      const updated = await prisma.order.update({
        where: { id },
        data: { status },
        include: { client: true, courier: true, photos: true },
      })

      // Send simple client notifications on status updates
      if (order.client.telegramId) {
        let msg = ''
        if (status === 'ASSEMBLING') {
          msg = `🌸 Флорист приступил к сборке вашего букета!`
        } else if (status === 'ASSEMBLED') {
          msg = `✨ Ваш букет полностью собран! Ожидайте фотографии для подтверждения.`
        } else if (status === 'PAID') {
          msg = `💳 Спасибо! Оплата успешно получена. Скоро передадим букет курьеру.`
        } else if (status === 'CANCELLED') {
          msg = `❌ Заказ №${order.id.substring(0, 8)} был отменен.`
        }

        if (msg) {
          await fastify.sendBotNotification(order.client.telegramId, msg)
        }
      }

      return updated
    },

    async addPhoto(id: string, photoUrl: string) {
      const order = await prisma.order.findUnique({ where: { id } })
      if (!order) throw new NotFoundError('Order')

      await prisma.orderPhoto.create({
        data: {
          orderId: id,
          photoUrl,
        },
      })

      // Automatically change status to ASSEMBLED once photo is uploaded
      return prisma.order.update({
        where: { id },
        data: { status: 'ASSEMBLED' },
        include: { client: true, courier: true, photos: true },
      })
    },

    async sendPhotoForApproval(id: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true, photos: true },
      })
      if (!order) throw new NotFoundError('Order')
      if (order.photos.length === 0) {
        throw new ValidationError('Cannot send approval without uploading a photo first')
      }

      // Update status
      await prisma.order.update({
        where: { id },
        data: { status: 'WAITING_FOR_APPROVAL' },
      })

      const lastPhoto = order.photos[order.photos.length - 1].photoUrl

      if (order.client.telegramId) {
        await fastify.sendBotNotification(
          order.client.telegramId,
          `🌸 *Ваш букет собран!* Пожалуйста, оцените готовый результат на фотографии ниже.\n\n` +
            `Если вас все устраивает, нажмите кнопку одобрения. Если нужно внести изменения — нажмите кнопку правок.`,
          {
            photoUrl: lastPhoto,
            approveButtons: true,
            orderId: order.id,
          }
        )
      }

      return { success: true, status: 'WAITING_FOR_APPROVAL' }
    },

    async sendPaymentLink(id: string, paymentLink: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      })
      if (!order) throw new NotFoundError('Order')

      await prisma.order.update({
        where: { id },
        data: { status: 'WAITING_FOR_PAYMENT', paymentLink },
      })

      if (order.client.telegramId) {
        await fastify.sendBotNotification(
          order.client.telegramId,
          `💳 *Ваш букет готов к доставке!*\n\n` +
            `Пожалуйста, оплатите заказ по ссылке ниже:\n` +
            `${paymentLink}\n\n` +
            `После совершения оплаты статус заказа обновится автоматически.`,
          {
            paymentLink,
          }
        )
      }

      return { success: true, status: 'WAITING_FOR_PAYMENT' }
    },

    async assignCourier(id: string, courierId: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      })
      if (!order) throw new NotFoundError('Order')

      const courier = await prisma.user.findUnique({ where: { id: courierId } })
      if (!courier || courier.role !== 'COURIER') {
        throw new ValidationError('Selected user is not a valid courier')
      }

      await prisma.order.update({
        where: { id },
        data: {
          courierId,
          status: 'DELIVERING',
        },
      })

      // 1. Notify Courier on Telegram with full delivery details
      if (courier.telegramId) {
        const details =
          `🚚 *Новая доставка!*\n\n` +
          `• Получатель: *${order.recipientName || 'Не указан'}*\n` +
          `• Телефон: *${order.recipientPhone || 'Не указан'}*\n` +
          `• Адрес: *${order.deliveryAddress || 'Не указан'}*\n` +
          `• Время доставки: *${order.deliveryTime ? order.deliveryTime.toLocaleString() : 'Как можно скорее'}*\n` +
          `• Комментарий курьеру: _${order.comment || 'нет'}_\n` +
          `• Текст открытки: _${order.postcardText || 'нет'}_\n\n` +
          `По завершении доставки нажмите кнопку ниже:`

        await fastify.sendBotNotification(courier.telegramId, details, {
          courierConfirm: true,
          orderId: order.id,
        })
      }

      // 2. Notify Client
      if (order.client.telegramId) {
        await fastify.sendBotNotification(
          order.client.telegramId,
          `🚚 *Заказ передан курьеру!*\n\n` +
            `Наш личный курьер ${courier.name} уже везет ваши цветы. Ожидайте доставку в назначенное время!`
        )
      }

      return { success: true, status: 'DELIVERING' }
    },
  }
}
