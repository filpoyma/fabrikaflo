import fp from 'fastify-plugin';
import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import type { FastifyInstance } from 'fastify';

import { getClientMainMenu, getCourierMainMenu } from './keyboards.ts';
import { getOrCreateUser } from './utils.ts';
import { registerPortfolioHandlers } from './portfolio.ts';
import { registerOrderHandlers } from './orders.ts';
import { registerCourierHandlers } from './courier.ts';
import { registerWizardHandlers } from './wizard.ts';

declare module 'fastify' {
  interface FastifyInstance {
    bot: any; // Grammy Bot instance or mock
    sendBotNotification: (telegramId: string, text: string, options?: any) => Promise<any>;
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    const token = fastify.config.TELEGRAM_BOT_TOKEN;
    const adminChatId = fastify.config.ADMIN_CHAT_ID;

    // Check for missing token or dummy token in development
    if (!token || token.startsWith('123456789:')) {
      fastify.log.warn('Using dummy/invalid Telegram Bot Token. Grammy Bot will run in Mock Mode.');

      fastify.decorate('bot', {
        api: {
          sendMessage: async (chatId: string | number, text: string) => {
            fastify.log.info({ chatId, text }, '[Mock Bot API] sendMessage');
            return { message_id: 1 };
          },
          sendPhoto: async (chatId: string | number, photo: string, options?: any) => {
            fastify.log.info(
              { chatId, photo, caption: options?.caption },
              '[Mock Bot API] sendPhoto'
            );
            return { message_id: 1 };
          },
        },
      });

      fastify.decorate(
        'sendBotNotification',
        async (telegramId: string, text: string, options?: any) => {
          fastify.log.info({ telegramId, text, options }, '[Mock Notification] Sent message');
          return { success: true };
        }
      );

      return;
    }

    const bot = new Bot(token);

    // Global bot error handler
    bot.catch((err) => {
      fastify.log.error(err.error, `Grammy bot error during update ${err.ctx.update.update_id}`);
    });

    // Command handlers
    bot.command('start', async (ctx) => {
      const user = await getOrCreateUser(fastify, ctx, adminChatId);
      if (!user) return;

      const welcomeText =
        `Привет, ${user.name}! Добро пожаловать в нашу цветочную мастерскую. 🌸\n\n` +
        `У нас только оригинальные букеты, создаваемые индивидуально под каждого клиента. ` +
        `Нажмите кнопку "🌸 Магазин", чтобы заказать букет, посмотреть примеры наших работ или проверить свои заказы.`;

      if (user.role === 'COURIER') {
        await ctx.reply(welcomeText, {
          reply_markup: getCourierMainMenu(),
        });
      } else {
        await ctx.reply(welcomeText, {
          reply_markup: getClientMainMenu(fastify.config.MINI_APP_URL),
        });
      }
    });

    // Back to client menu command for couriers/admins
    bot.hears('🌸 В меню клиента', async (ctx) => {
      const user = await getOrCreateUser(fastify, ctx, adminChatId);
      if (!user) return;
      await ctx.reply('Переключаю на меню клиента:', {
        reply_markup: getClientMainMenu(fastify.config.MINI_APP_URL),
      });
    });

    // Contacts
    bot.hears('📞 Контакты', async (ctx) => {
      await ctx.reply(
        `💐 *Цветочная мастерская FabrikaFlo*\n\n` +
          `📍 Адрес: Вифанская, 29, Sergiyev Posad 141300\n` +
          `📞 Телефон: 8 926 263-29-29\n` +
          `⏰ Режим работы: ежедневно с 08:30 до 21:00\n\n` +
          `Мы создаем только авторские оригинальные букеты, вдохновленные сезонной свежестью цветов. ✨`,
        { parse_mode: 'Markdown' }
      );
    });

    // Register module-specific handlers
    registerPortfolioHandlers(bot, fastify, adminChatId);
    registerOrderHandlers(bot, fastify, adminChatId);
    registerCourierHandlers(bot, fastify, adminChatId);
    registerWizardHandlers(bot, fastify, token, adminChatId);

    // Set Chat Menu Button to open the Web App
    if (fastify.config.MINI_APP_URL && fastify.config.MINI_APP_URL.startsWith('https://')) {
      bot.api
        .setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: '🌸 Магазин',
            web_app: { url: fastify.config.MINI_APP_URL },
          },
        })
        .catch((err) => {
          fastify.log.error(err, 'Failed to set Chat Menu Button');
        });
    } else {
      bot.api
        .setChatMenuButton({
          menu_button: {
            type: 'default',
          },
        })
        .catch(() => {});
    }

    // Setup running mode (Webhook or Polling)
    const mode = fastify.config.TELEGRAM_BOT_MODE;
    const webhookUrl = fastify.config.TELEGRAM_WEBHOOK_URL;

    if (mode === 'webhook') {
      if (!webhookUrl) {
        fastify.log.error('TELEGRAM_WEBHOOK_URL is not set, falling back to polling.');
      } else {
        const urlObj = new URL(webhookUrl);
        const path = `/bot${token}`;
        const fullUrl = `${urlObj.origin}${path}`;

        // Register POST route for telegram webhook
        fastify.post(path, async (request, reply) => {
          const handleUpdate = webhookCallback(bot, 'fastify');
          return handleUpdate(request, reply);
        });

        try {
          await bot.api.setWebhook(fullUrl);
          fastify.log.info(`Telegram Webhook set to: ${fullUrl}`);
        } catch (err) {
          fastify.log.error(err, 'Failed to set Telegram webhook');
        }
      }
    } else {
      // Delete webhook to ensure polling works
      try {
        await bot.api.deleteWebhook();
        bot.start().catch((err) => {
          fastify.log.error(err, 'Error during bot polling execution');
        });
        fastify.log.info('Grammy Bot starting in polling mode...');
      } catch (err) {
        fastify.log.error(err, 'Failed to delete webhook for polling');
      }
    }

    fastify.decorate('bot', bot);

    fastify.decorate(
      'sendBotNotification',
      async (telegramId: string, text: string, options?: any) => {
        try {
          if (options?.photoUrl) {
            const inlineKeyboard = new InlineKeyboard();
            if (options?.approveButtons && options?.orderId) {
              inlineKeyboard
                .text('✅ Одобрить букет', `approve_bouquet:${options.orderId}`)
                .row()
                .text('💬 Внести правки', `disapprove_bouquet:${options.orderId}`);
            }
            const isUrl =
              options?.paymentLink?.startsWith('http://') ||
              options?.paymentLink?.startsWith('https://');
            if (options?.paymentLink) {
              if (isUrl) {
                inlineKeyboard.url('💳 Оплатить заказ', options.paymentLink);
              } else {
                text += `\n• Оплата: ${options.paymentLink}`;
              }
            }

            return await bot.api.sendPhoto(telegramId, options.photoUrl, {
              caption: text,
              parse_mode: 'Markdown',
              reply_markup: inlineKeyboard,
            });
          } else {
            const inlineKeyboard = new InlineKeyboard();
            const isUrl =
              options?.paymentLink?.startsWith('http://') ||
              options?.paymentLink?.startsWith('https://');
            if (options?.paymentLink) {
              if (isUrl) {
                inlineKeyboard.url('💳 Оплатить заказ', options.paymentLink);
              } else {
                text += `\n• Оплата: ${options.paymentLink}`;
              }
            }
            if (options?.courierConfirm && options?.orderId) {
              inlineKeyboard.text('✅ Доставлено', `courier_complete:${options.orderId}`);
            }

            return await bot.api.sendMessage(telegramId, text, {
              parse_mode: 'Markdown',
              reply_markup: inlineKeyboard,
            });
          }
        } catch (err) {
          fastify.log.error(err, 'Failed to send bot notification to telegram ID: %s', telegramId);
        }
      }
    );

    fastify.addHook('onClose', async () => {
      fastify.log.info('Stopping Telegram bot...');
      await bot.stop();
    });
  },
  {
    name: 'bot',
    dependencies: ['prisma', 'env', 'cloudinary'],
  }
);
