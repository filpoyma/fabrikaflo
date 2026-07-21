import type { FastifyInstance } from 'fastify';
import { InlineKeyboard } from 'grammy';
import { getOrCreateUser } from './utils.ts';

export function registerOrderHandlers(bot: any, fastify: FastifyInstance, adminChatId?: string) {
  // My Orders (📦 Мои заказы)
  bot.hears('📦 Мои заказы', async (ctx: any) => {
    const user = await getOrCreateUser(fastify, ctx, adminChatId);
    if (!user) return;

    const orders = await fastify.prisma.order.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { photos: true },
    });

    if (orders.length === 0) {
      return ctx.reply(
        'У вас пока нет заказов. Вы можете создать заявку, зайдя в \n\n"🌸 Магазин".'
      );
    }

    await ctx.reply(`Найдено заказов: ${orders.length}. Вот последние из них:`);

    const statusTranslations: Record<string, string> = {
      CREATED: 'Создан',
      ASSEMBLING: 'Флорист собирает букет',
      ASSEMBLED: 'Букет собран',
      WAITING_FOR_APPROVAL: 'Ожидает одобрения',
      APPROVED: 'Букет одобрен',
      WAITING_FOR_PAYMENT: 'Ожидает оплаты',
      PAID: 'Оплачен',
      DELIVERING: 'Передан курьеру (доставка)',
      DELIVERED: 'Доставлен ✅',
      CANCELLED: 'Отменен ❌',
    };

    for (const order of orders.slice(0, 5)) {
      let orderDetails =
        `💐 *Заказ от ${order.createdAt.toLocaleDateString()}*\n` +
        `• Бюджет: *${order.budget} руб.*\n` +
        `• Статус: *${statusTranslations[order.status] || order.status}*\n`;

      if (order.wishes) orderDetails += `• Пожелания: _${order.wishes}_\n`;
      if (order.postcardText) orderDetails += `• Текст открытки: _${order.postcardText}_\n`;
      if (order.recipientName) orderDetails += `• Получатель: ${order.recipientName}\n`;

      // Show button for payment link if waiting for payment
      const inlineKeyboard = new InlineKeyboard();
      const isUrl =
        order.paymentLink?.startsWith('http://') || order.paymentLink?.startsWith('https://');
      if (order.status === 'WAITING_FOR_PAYMENT' && order.paymentLink) {
        if (isUrl) {
          inlineKeyboard.url('💳 Оплатить заказ', order.paymentLink);
        } else {
          orderDetails += `• Оплата: ${order.paymentLink}\n`;
        }
      }

      // Show photo approval buttons if waiting for approval
      if (order.status === 'WAITING_FOR_APPROVAL' && order.photos.length > 0) {
        inlineKeyboard
          .text('✅ Одобрить букет', `approve_bouquet:${order.id}`)
          .row()
          .text('💬 Внести правки', `disapprove_bouquet:${order.id}`);
      }

      if (order.photos.length > 0) {
        // Send with the latest photo
        await ctx.replyWithPhoto(order.photos[order.photos.length - 1].photoUrl, {
          caption: orderDetails,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard,
        });
      } else {
        await ctx.reply(orderDetails, {
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard,
        });
      }
    }
  });

  // Handle Bouquet Approval
  bot.callbackQuery(/^approve_bouquet:(.+)$/, async (ctx: any) => {
    const orderId = ctx.match[1];
    const order = await fastify.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return ctx.answerCallbackQuery({ text: 'Заказ не найден.' });
    }

    if (order.status !== 'WAITING_FOR_APPROVAL') {
      return ctx.answerCallbackQuery({ text: 'Этот букет уже одобрен или статус изменился.' });
    }

    // Update order status to waiting for payment
    await fastify.prisma.order.update({
      where: { id: orderId },
      data: { status: 'WAITING_FOR_PAYMENT' },
    });

    await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() });
    await ctx.reply(
      `Спасибо за подтверждение! Букет одобрен. 👍\n\n` +
        `Администратор сейчас сформирует и вышлет вам ссылку на оплату.`
    );

    // Notify Admins
    if (adminChatId) {
      const admins = adminChatId.split(',').map((id) => id.trim());
      for (const adminId of admins) {
        try {
          await bot.api.sendMessage(
            adminId,
            `🔔 Клиент одобрил букет по заказу бюджет: *${order.budget} руб.*\n` +
              `Переведите заказ в статус ожидания оплаты или отправьте ссылку.`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          // Ignore
        }
      }
    }

    await ctx.answerCallbackQuery({ text: 'Одобрено!' });
  });

  // Handle Bouquet Disapproval
  bot.callbackQuery(/^disapprove_bouquet:(.+)$/, async (ctx: any) => {
    const orderId = ctx.match[1];
    const user = await getOrCreateUser(fastify, ctx, adminChatId);
    if (!user) return;

    // Set user state to wait for feedback
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        botState: 'DISAPPROVE_FEEDBACK',
        botData: JSON.stringify({ orderId }),
      },
    });

    await ctx.reply(
      'Пожалуйста, напишите текстом, что именно нужно исправить или доработать в букете:'
    );
    await ctx.answerCallbackQuery();
  });
}
