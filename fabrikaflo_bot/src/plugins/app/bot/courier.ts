import type { FastifyInstance } from 'fastify'
import { InlineKeyboard } from 'grammy'
import { buildCourierDeliveryKeyboard } from './mapLinks.ts'
import { getOrCreateUser } from './utils.ts'

export function registerCourierHandlers(bot: any, fastify: FastifyInstance, adminChatId?: string) {
  // Courier Deliveries (📦 Мои доставки)
  bot.hears('📦 Мои доставки', async (ctx: any) => {
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
    if (!user) return

    if (user.role !== 'COURIER') {
      return ctx.reply('Этот раздел доступен только личным курьерам магазина.')
    }

    const deliveries = await fastify.prisma.order.findMany({
      where: {
        courierId: user.id,
        status: 'DELIVERING',
      },
      orderBy: { deliveryTime: 'asc' },
      include: { client: true },
    })

    if (deliveries.length === 0) {
      return ctx.reply('У вас нет активных доставок на сегодня! Отдыхайте. ☕️')
    }

    await ctx.reply(`У вас активных доставок: ${deliveries.length}.`)

    for (const order of deliveries) {
      const details =
        `🚗 *Доставка заказа*\n\n` +
        `• Получатель: *${order.recipientName || 'Не указан'}*\n` +
        `• Телефон: *${order.recipientPhone || 'Не указан'}*\n` +
        `• Адрес: *${order.deliveryAddress || 'Не указан'}*\n` +
        `• Время доставки: *${order.deliveryTime ? order.deliveryTime.toLocaleString() : 'Как можно скорее'}*\n` +
        `• Комментарий курьеру: _${order.comment || 'нет'}_\n` +
        `• Открытка: _${order.postcardText || 'нет'}_\n` +
        `• Заказчик: ${order.client.name} (${order.client.phone || ''})`

      const inlineKeyboard = buildCourierDeliveryKeyboard(order.id, order.deliveryAddress)

      await ctx.reply(details, {
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard,
      })
    }
  })

  // Handle Courier Delivery Complete Callback
  bot.callbackQuery(/^courier_complete:(.+)$/, async (ctx: any) => {
    const orderId = ctx.match[1]
    const order = await fastify.prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    })

    if (!order) {
      return ctx.answerCallbackQuery({ text: 'Заказ не найден.' })
    }

    if (order.status !== 'DELIVERING') {
      return ctx.answerCallbackQuery({ text: 'Этот заказ уже доставлен или отменен.' })
    }

    // Update status to DELIVERED
    await fastify.prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
    })

    await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() })
    await ctx.reply(`🎉 Заказ доставлен! Статус изменен.`)

    // Notify client
    if (order.client.telegramId) {
      try {
        await bot.api.sendMessage(
          order.client.telegramId,
          `🎉 Ваш букет успешно доставлен получателю! Спасибо, что доверили нам этот приятный момент. 🌸`
        )
      } catch (err) {
        fastify.log.error(err, 'Failed to notify client %s about delivery of order %s', order.client.telegramId, order.id)
      }
    }

    // Notify admins
    if (adminChatId) {
      const deliveredAt = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      const admins = adminChatId.split(',').map((id) => id.trim())
      for (const adminId of admins) {
        try {
          await bot.api.sendMessage(
            adminId,
            `✅ Курьер доставил заказ для клиента: *${order.client.name}* (Бюджет: ${order.budget} руб., доставлено: ${deliveredAt})`,
            { parse_mode: 'Markdown' },
          )
        } catch (err) {
          fastify.log.error(err, 'Failed to notify admin %s about delivery of order %s', adminId, order.id)
        }
      }
    }

    await ctx.answerCallbackQuery({ text: 'Доставлено!' })
  })
}
