import type { FastifyInstance } from 'fastify';

import type { OrderStatus } from '../../generated/prisma/client.ts';
import { parseDeliveryDateTime } from '../../lib/deliveryDateTime.ts';
import { NotFoundError, ValidationError } from '../../lib/errors.ts';

export function createOrdersService(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  return {
    async getAll() {
      return prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { client: true, courier: true, photos: true, request: true },
      });
    },

    async getById(id: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true, courier: true, photos: true, request: true },
      });
      if (!order) throw new NotFoundError('Order');
      return order;
    },

    async createDirect(data: {
      clientId: string;
      recipientName?: string;
      recipientPhone?: string;
      deliveryAddress?: string;
      deliveryTime?: string;
      budget: number;
      wishes?: string;
      postcardText?: string;
      comment?: string;
    }) {
      const client = await prisma.user.findUnique({ where: { id: data.clientId } });
      if (!client) throw new NotFoundError('Client user');

      const time = data.deliveryTime ? parseDeliveryDateTime(data.deliveryTime) : null;

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
        include: { client: true, courier: true, photos: true, request: true },
      });

      // Notify Client in Telegram
      if (client.telegramId) {
        await fastify.sendBotNotification(
          client.telegramId,
          `🌸 *Создан новый заказ!*\n\n` +
            `Администратор оформил заказ для вас.\n` +
            `• Сумма: *${order.budget} (руб.)*\n` +
            `• Пожелания: _${order.wishes || 'оригинальный букет'}_\n\n` +
            `Флорист уже приступает к сборке! ✨`
        );
      }

      return order;
    },

    async updateStatus(id: string, status: OrderStatus) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      });
      if (!order) throw new NotFoundError('Order');

      const updated = await prisma.order.update({
        where: { id },
        data: { status },
        include: { client: true, courier: true, photos: true, request: true },
      });

      // Send simple client notifications on status updates
      if (order.client.telegramId) {
        let msg = '';
        if (status === 'ASSEMBLING') {
          msg = `🌸 Флорист приступил к сборке вашего букета!`;
        } else if (status === 'ASSEMBLED') {
          msg = `✨ Ваш букет полностью собран! Ожидайте фотографии для подтверждения.`;
        } else if (status === 'PAID') {
          msg = `💳 Спасибо! Оплата успешно получена. Скоро передадим букет курьеру.`;
        } else if (status === 'CANCELLED') {
          msg = `❌ Заказ №${order.id.substring(0, 8)} был отменен.`;
        }

        if (msg) {
          await fastify.sendBotNotification(order.client.telegramId, msg);
        }
      }

      return updated;
    },

    async addPhoto(id: string, photoUrl: string) {
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundError('Order');

      await prisma.orderPhoto.create({
        data: {
          orderId: id,
          photoUrl,
        },
      });

      // Automatically change status to ASSEMBLED once photo is uploaded
      return prisma.order.update({
        where: { id },
        data: { status: 'ASSEMBLED' },
        include: { client: true, courier: true, photos: true, request: true },
      });
    },

    async sendPhotoForApproval(id: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true, photos: true },
      });
      if (!order) throw new NotFoundError('Order');
      if (order.photos.length === 0) {
        throw new ValidationError('Cannot send approval without uploading a photo first');
      }

      // Update status
      await prisma.order.update({
        where: { id },
        data: { status: 'WAITING_FOR_APPROVAL' },
      });

      const lastPhoto = order.photos[order.photos.length - 1].photoUrl;

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
        );
      }

      return { success: true, status: 'WAITING_FOR_APPROVAL' };
    },

    async sendPaymentLink(id: string, paymentLink: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      });
      if (!order) throw new NotFoundError('Order');

      await prisma.order.update({
        where: { id },
        data: { status: 'WAITING_FOR_PAYMENT', paymentLink },
      });

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
        );
      }

      return { success: true, status: 'WAITING_FOR_PAYMENT' };
    },

    async assignCourier(id: string, courierId: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      });
      if (!order) throw new NotFoundError('Order');

      const courier = await prisma.user.findUnique({ where: { id: courierId } });
      if (!courier || courier.role !== 'COURIER') {
        throw new ValidationError('Selected user is not a valid courier');
      }

      await prisma.order.update({
        where: { id },
        data: {
          courierId,
          status: 'DELIVERING',
        },
      });

      // 1. Notify Courier on Telegram with full delivery details
      if (courier.telegramId) {
        const details =
          `🚚 *Новая доставка!*\n\n` +
          `• Получатель: *${order.recipientName || 'Не указан'}*\n` +
          `• Телефон: *${order.recipientPhone || 'Не указан'}*\n` +
          `• Адрес: *${order.deliveryAddress || 'Не указан'}*\n` +
          `• Время доставки: *${order.deliveryTime ? order.deliveryTime.toLocaleString() : 'Как можно скорее'}*\n` +
          `• Комментарий курьеру: _${order.comment || 'нет'}_\n` +
          `• Открытка: _${order.postcardText ? 'да' : 'нет'}_\n` +
          `\nПо завершении доставки нажмите кнопку Доставлено:`;

        await fastify.sendBotNotification(courier.telegramId, details, {
          courierConfirm: true,
          orderId: order.id,
          deliveryAddress: order.deliveryAddress,
        });
      }

      // 2. Notify Client
      if (order.client.telegramId) {
        await fastify.sendBotNotification(
          order.client.telegramId,
          `🚚 *Заказ передан курьеру!*\n\n` +
            `Наш личный курьер ${courier.name} уже везет ваши цветы. Ожидайте доставку в назначенное время!`
        );
      }

      return { success: true, status: 'DELIVERING' };
    },

    async getMyOrders(userId: string) {
      return prisma.order.findMany({
        where: { clientId: userId },
        orderBy: { createdAt: 'desc' },
        include: { client: true, courier: true, photos: true, request: true },
      });
    },

    async clientGetById(id: string, userId: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true, courier: true, photos: true, request: true },
      });
      if (!order || order.clientId !== userId) throw new NotFoundError('Order');
      return order;
    },

    async clientApproveOrder(id: string, userId: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      });
      if (!order || order.clientId !== userId) throw new NotFoundError('Order');
      if (order.status !== 'WAITING_FOR_APPROVAL') {
        throw new ValidationError('Order is not waiting for approval');
      }

      await prisma.order.update({
        where: { id },
        data: { status: 'WAITING_FOR_PAYMENT' },
      });

      const adminChatId = fastify.config.ADMIN_CHAT_ID;
      if (adminChatId) {
        const admins = adminChatId.split(',').map((a) => a.trim());
        for (const adminId of admins) {
          try {
            await fastify.bot.api.sendMessage(
              adminId,
              `🔔 Клиент одобрил букет по заказу на ${order.budget} руб.\n` +
                `Ожидайте оплаты или отправьте ссылку.`
            );
          } catch (err) {
            fastify.log.error(err, 'Failed to notify admin %s about bouquet approval for order %s', adminId, order.id)
          }
        }
      }

      return { success: true, status: 'WAITING_FOR_PAYMENT' };
    },

    async clientDisapproveOrder(id: string, userId: string, feedback: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      });
      if (!order || order.clientId !== userId) throw new NotFoundError('Order');
      if (order.status !== 'WAITING_FOR_APPROVAL') {
        throw new ValidationError('Order is not waiting for approval');
      }

      const updatedFeedback = order.clientFeedback
        ? `${order.clientFeedback}\n${feedback}`
        : feedback;

      await prisma.order.update({
        where: { id },
        data: {
          status: 'ASSEMBLING',
          clientFeedback: updatedFeedback,
        },
      });

      const adminChatId = fastify.config.ADMIN_CHAT_ID;
      if (adminChatId) {
        const admins = adminChatId.split(',').map((a) => a.trim());
        for (const adminId of admins) {
          try {
            await fastify.bot.api.sendMessage(
              adminId,
              `⚠️ Клиент отклонил букет по заказу на ${order.budget} руб. и внес правки:\n` +
                `_"${feedback}"_\n` +
                `Заказ возвращен флористу в статус сборки (ASSEMBLING).`
            );
          } catch (err) {
            fastify.log.error(err, 'Failed to notify admin %s about bouquet disapproval for order %s', adminId, order.id)
          }
        }
      }

      return { success: true, status: 'ASSEMBLING' };
    },

    async clientUploadReceipt(id: string, fileUrl: string, userId: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { client: true },
      });
      if (!order || order.clientId !== userId) throw new NotFoundError('Order');

      const updatedComment = order.comment
        ? `${order.comment}\n[Чек об оплате загружен: ${fileUrl}]`
        : `[Чек об оплате загружен: ${fileUrl}]`;

      await prisma.order.update({
        where: { id },
        data: {
          status: 'PAID',
          comment: updatedComment,
        },
      });

      const adminChatId = fastify.config.ADMIN_CHAT_ID;
      if (adminChatId) {
        const admins = adminChatId.split(',').map((a) => a.trim());
        for (const adminId of admins) {
          try {
            await fastify.bot.api.sendMessage(
              adminId,
              `🔔 Клиент загрузил чек об оплате по заказу на ${order.budget} руб.\n` +
                `Ссылка на чек: ${fileUrl}\n` +
                `Статус заказа изменен на Оплачен (PAID).`
            );
          } catch (err) {
            fastify.log.error(err, 'Failed to notify admin %s about payment receipt for order %s', adminId, order.id)
          }
        }
      }

      return { success: true };
    },
  };
}
