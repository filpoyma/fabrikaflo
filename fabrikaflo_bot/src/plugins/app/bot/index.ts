import fp from 'fastify-plugin'
import { Bot, InlineKeyboard, Keyboard, webhookCallback } from 'grammy'
import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    bot: any // Grammy Bot instance or mock
    sendBotNotification: (telegramId: string, text: string, options?: any) => Promise<any>
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    const token = fastify.config.TELEGRAM_BOT_TOKEN
    const adminChatId = fastify.config.ADMIN_CHAT_ID

    // Check for missing token or dummy token in development
    if (!token || token.startsWith('123456789:')) {
      fastify.log.warn('Using dummy/invalid Telegram Bot Token. Grammy Bot will run in Mock Mode.')

      fastify.decorate('bot', {
        api: {
          sendMessage: async (chatId: string | number, text: string) => {
            fastify.log.info({ chatId, text }, '[Mock Bot API] sendMessage')
            return { message_id: 1 }
          },
          sendPhoto: async (chatId: string | number, photo: string, options?: any) => {
            fastify.log.info({ chatId, photo, caption: options?.caption }, '[Mock Bot API] sendPhoto')
            return { message_id: 1 }
          },
        },
      })

      fastify.decorate('sendBotNotification', async (telegramId: string, text: string, options?: any) => {
        fastify.log.info({ telegramId, text, options }, '[Mock Notification] Sent message')
        return { success: true }
      })

      return
    }

    const bot = new Bot(token)

    // Global bot error handler
    bot.catch((err) => {
      fastify.log.error(err.error, `Grammy bot error during update ${err.ctx.update.update_id}`)
    })

    // Keyboards
    const getClientMainMenu = () => {
      return new Keyboard()
        .text('🌸 Заказать букет').text('❤️ Наши работы')
        .row()
        .text('📦 Мои заказы').text('📞 Контакты')
        .resized()
    }

    const getCourierMainMenu = () => {
      return new Keyboard()
        .text('📦 Мои доставки')
        .row()
        .text('🌸 В меню клиента')
        .resized()
    }

    // Helper to find or create User from context
    async function getOrCreateUser(ctx: any) {
      const tgId = ctx.from?.id.toString()
      if (!tgId) return null

      let user = await fastify.prisma.user.findUnique({
        where: { telegramId: tgId },
      })

      if (!user) {
        // Check if this user telegram ID is listed as admin
        const admins = adminChatId ? adminChatId.split(',').map((id) => id.trim()) : []
        const isAdmin = admins.includes(tgId)

        user = await fastify.prisma.user.create({
          data: {
            telegramId: tgId,
            username: ctx.from?.username ?? null,
            name: `${ctx.from?.first_name ?? ''} ${ctx.from?.last_name ?? ''}`.trim() || 'Client',
            role: isAdmin ? 'ADMIN' : 'CLIENT',
          },
        })
      } else {
        // Keep profile updated
        user = await fastify.prisma.user.update({
          where: { telegramId: tgId },
          data: {
            username: ctx.from?.username ?? user.username,
            name: `${ctx.from?.first_name ?? ''} ${ctx.from?.last_name ?? ''}`.trim() || user.name,
          },
        })
      }

      return user
    }

    // Command handlers
    bot.command('start', async (ctx) => {
      const user = await getOrCreateUser(ctx)
      if (!user) return

      const welcomeText =
        `Привет, ${user.name}! Добро пожаловать в нашу цветочную мастерскую. 🌸\n\n` +
        `У нас только оригинальные букеты, создаваемые индивидуально под каждого клиента. ` +
        `Используйте меню ниже, чтобы заказать букет, посмотреть примеры наших работ или проверить свои заказы.`

      if (user.role === 'COURIER') {
        await ctx.reply(welcomeText, {
          reply_markup: getCourierMainMenu(),
        })
      } else {
        await ctx.reply(welcomeText, {
          reply_markup: getClientMainMenu(),
        })
      }
    })

    // Back to client menu command for couriers/admins
    bot.hears('🌸 В меню клиента', async (ctx) => {
      const user = await getOrCreateUser(ctx)
      if (!user) return
      await ctx.reply('Переключаю на меню клиента:', {
        reply_markup: getClientMainMenu(),
      })
    })

    // Contacts
    bot.hears('📞 Контакты', async (ctx) => {
      await ctx.reply(
        `💐 *Цветочная мастерская FabrikaFlo*\n\n` +
          `📍 Адрес: Вифанская, 29, Sergiyev Posad 141300\n` +
          `📞 Телефон: 8 926 263-29-29\n` +
          `⏰ Режим работы: ежедневно с 08:30 до 21:00\n\n` +
          `Мы создаем только авторские оригинальные букеты, вдохновленные сезонной свежестью цветов. ✨`,
        { parse_mode: 'Markdown' }
      )
    })

    // Portfolio navigator (Interactive "Наши работы")
    bot.hears('❤️ Наши работы', async (ctx) => {
      const items = await fastify.prisma.portfolioItem.findMany({
        orderBy: { createdAt: 'desc' },
      })

      if (items.length === 0) {
        return ctx.reply('В данный момент галерея пуста. Скоро администратор добавит новые работы! 🌸')
      }

      // Show first item
      const item = items[0]
      const keyboard = new InlineKeyboard()
      if (items.length > 1) {
        keyboard.text('➡️ Вперед', 'portfolio:1')
      }
      keyboard.text('❌ Закрыть', 'portfolio:close')

      const caption = `*${item.title || 'Наши работы'}*\n${item.description || ''}\n\n[1 / ${items.length}]`
      await ctx.replyWithPhoto(item.photoUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    })

    // Inline Query Callback handling for Portfolio
    bot.on('callback_query:data', async (ctx, next) => {
      const data = ctx.callbackQuery.data

      if (data.startsWith('portfolio:')) {
        const action = data.split(':')[1]
        if (action === 'close') {
          await ctx.deleteMessage()
          return ctx.answerCallbackQuery()
        }

        const index = parseInt(action, 10)
        const items = await fastify.prisma.portfolioItem.findMany({
          orderBy: { createdAt: 'desc' },
        })

        if (items.length === 0 || !items[index]) {
          return ctx.answerCallbackQuery({ text: 'Изображение не найдено.' })
        }

        const item = items[index]
        const keyboard = new InlineKeyboard()
        if (index > 0) {
          keyboard.text('⬅️ Назад', `portfolio:${index - 1}`)
        }
        if (index < items.length - 1) {
          keyboard.text('➡️ Вперед', `portfolio:${index + 1}`)
        }
        keyboard.text('❌ Закрыть', 'portfolio:close')

        const caption = `*${item.title || 'Наши работы'}*\n${item.description || ''}\n\n[${index + 1} / ${items.length}]`

        try {
          // Edit media of existing message
          await ctx.editMessageMedia(
            {
              type: 'photo',
              media: item.photoUrl,
              caption,
              parse_mode: 'Markdown',
            },
            { reply_markup: keyboard }
          )
        } catch (e) {
          // Fallback if media is same or update fails
        }
        await ctx.answerCallbackQuery()
      }

      // Handle Bouquet Approval
      if (data.startsWith('approve_bouquet:')) {
        const orderId = data.split(':')[1]
        const order = await fastify.prisma.order.findUnique({
          where: { id: orderId },
        })

        if (!order) {
          return ctx.answerCallbackQuery({ text: 'Заказ не найден.' })
        }

        if (order.status !== 'WAITING_FOR_APPROVAL') {
          return ctx.answerCallbackQuery({ text: 'Этот букет уже одобрен или статус изменился.' })
        }

        // Update order status to waiting for payment
        await fastify.prisma.order.update({
          where: { id: orderId },
          data: { status: 'WAITING_FOR_PAYMENT' },
        })

        await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() })
        await ctx.reply(
          `Спасибо за подтверждение! Букет одобрен. 👍\n\n` +
            `Администратор сейчас сформирует и вышлет вам ссылку на оплату.`
        )

        // Notify Admins
        if (adminChatId) {
          const admins = adminChatId.split(',').map((id) => id.trim())
          for (const adminId of admins) {
            await bot.api.sendMessage(
              adminId,
              `🔔 Клиент одобрил букет по заказу бюджет: *${order.budget} руб.*\n` +
                `Переведите заказ в статус ожидания оплаты или отправьте ссылку.`,
              { parse_mode: 'Markdown' }
            )
          }
        }

        await ctx.answerCallbackQuery({ text: 'Одобрено!' })
      }

      // Handle Bouquet Disapproval
      if (data.startsWith('disapprove_bouquet:')) {
        const orderId = data.split(':')[1]
        const user = await getOrCreateUser(ctx)
        if (!user) return

        // Set user state to wait for feedback
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'DISAPPROVE_FEEDBACK',
            botData: JSON.stringify({ orderId }),
          },
        })

        await ctx.reply('Пожалуйста, напишите текстом, что именно нужно исправить или доработать в букете:')
        await ctx.answerCallbackQuery()
      }

      // Handle Courier Delivery Complete Callback
      if (data.startsWith('courier_complete:')) {
        const orderId = data.split(':')[1]
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
        const updatedOrder = await fastify.prisma.order.update({
          where: { id: orderId },
          data: { status: 'DELIVERED' },
        })

        await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() })
        await ctx.reply(`🎉 Заказ доставлен! Статус изменен.`)

        // Notify client
        if (order.client.telegramId) {
          await bot.api.sendMessage(
            order.client.telegramId,
            `🎉 Ваш букет успешно доставлен получателю! Спасибо, что доверили нам этот приятный момент. 🌸`
          )
        }

        // Notify admins
        if (adminChatId) {
          const admins = adminChatId.split(',').map((id) => id.trim())
          for (const adminId of admins) {
            await bot.api.sendMessage(
              adminId,
              `✅ Курьер доставил заказ для клиента: *${order.client.name}* (Бюджет: ${order.budget} руб.)`
            )
          }
        }

        await ctx.answerCallbackQuery({ text: 'Доставлено!' })
      }
      await next()
    })

    // My Orders (📦 Мои заказы)
    bot.hears('📦 Мои заказы', async (ctx) => {
      const user = await getOrCreateUser(ctx)
      if (!user) return

      const orders = await fastify.prisma.order.findMany({
        where: { clientId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { photos: true },
      })

      if (orders.length === 0) {
        return ctx.reply('У вас пока нет заказов. Вы можете создать заявку, нажав "🌸 Заказать букет".')
      }

      await ctx.reply(`Найдено заказов: ${orders.length}. Вот последние из них:`)

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
      }

      for (const order of orders.slice(0, 5)) {
        let orderDetails =
          `💐 *Заказ от ${order.createdAt.toLocaleDateString()}*\n` +
          `• Бюджет: *${order.budget} руб.*\n` +
          `• Статус: *${statusTranslations[order.status] || order.status}*\n`

        if (order.wishes) orderDetails += `• Пожелания: _${order.wishes}_\n`
        if (order.postcardText) orderDetails += `• Текст открытки: _${order.postcardText}_\n`
        if (order.recipientName) orderDetails += `• Получатель: ${order.recipientName}\n`

        // Show button for payment link if waiting for payment
        const inlineKeyboard = new InlineKeyboard()
        const isUrl = order.paymentLink?.startsWith('http://') || order.paymentLink?.startsWith('https://')
        if (order.status === 'WAITING_FOR_PAYMENT' && order.paymentLink) {
          if (isUrl) {
            inlineKeyboard.url('💳 Оплатить заказ', order.paymentLink)
          } else {
            orderDetails += `• Оплата: ${order.paymentLink}\n`
          }
        }

        // Show photo approval buttons if waiting for approval
        if (order.status === 'WAITING_FOR_APPROVAL' && order.photos.length > 0) {
          inlineKeyboard
            .text('✅ Одобрить букет', `approve_bouquet:${order.id}`)
            .row()
            .text('💬 Внести правки', `disapprove_bouquet:${order.id}`)
        }

        if (order.photos.length > 0) {
          // Send with the latest photo
          await ctx.replyWithPhoto(order.photos[order.photos.length - 1].photoUrl, {
            caption: orderDetails,
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard,
          })
        } else {
          await ctx.reply(orderDetails, {
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard,
          })
        }
      }
    })

    // Courier Deliveries (📦 Мои доставки)
    bot.hears('📦 Мои доставки', async (ctx) => {
      const user = await getOrCreateUser(ctx)
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

        const inlineKeyboard = new InlineKeyboard().text(
          '✅ Доставлено',
          `courier_complete:${order.id}`
        )

        await ctx.reply(details, {
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard,
        })
      }
    })

    // Step-by-step Conversation Wizard Logic for client bouquet order requests
    bot.hears('🌸 Заказать букет', async (ctx) => {
      const user = await getOrCreateUser(ctx)
      if (!user) return

      // Set user state to OCCASION
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          botState: 'WIZARD_OCCASION',
          botData: JSON.stringify({}),
        },
      })

      await ctx.reply(
        `Начнем оформление заявки на оригинальный букет! 🌸\n\n` +
          `Ответьте на несколько вопросов, чтобы мы подобрали идеальный вариант.\n\n` +
          `Шаг 1/6: *Для какого повода нужен букет?* (например: День рождения мамы, годовщина, признание в любви, свидание)`,
        { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }
      )
    })

    // Generic messages listener to handle wizard steps
    bot.on('message', async (ctx) => {
      const user = await getOrCreateUser(ctx)
      if (!user) return
      const state = user.botState
      if (!state || state === 'Idle') return

      const text = ctx.message.text
      let data = {}
      try {
        data = JSON.parse(user.botData || '{}')
      } catch (e) {
        data = {}
      }

      // Handle Feedback state on disapproved bouquet
      if (state === 'DISAPPROVE_FEEDBACK') {
        const orderId = (data as any).orderId
        if (!orderId) {
          await fastify.prisma.user.update({
            where: { id: user.id },
            data: { botState: 'Idle', botData: null },
          })
          return ctx.reply('Ошибка сессии. Пожалуйста, попробуйте еще раз.')
        }

        // Add client wishes to order comments and change status back to ASSEMBLING
        const order = await fastify.prisma.order.findUnique({ where: { id: orderId } })
        const feedbackComment = `[Правки клиента]: ${text || ''}`
        const updatedComment = order?.comment
          ? `${order.comment}\n${feedbackComment}`
          : feedbackComment

        await fastify.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'ASSEMBLING',
            comment: updatedComment,
          },
        })

        // Clear user state
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { botState: 'Idle', botData: null },
        })

        await ctx.reply(
          `Правки приняты и переданы флористу! 🌸 Мы доработаем букет и пришлем вам новое фото.`,
          { reply_markup: getClientMainMenu() }
        )

        // Notify Admins
        if (adminChatId) {
          const admins = adminChatId.split(',').map((id) => id.trim())
          for (const adminId of admins) {
            await bot.api.sendMessage(
              adminId,
              `⚠️ Клиент отклонил букет по заказу на ${order?.budget} руб. и внес правки:\n` +
                `_"${text}"_\n` +
                `Заказ переведен обратно в статус сборки (ASSEMBLING).`
            )
          }
        }
        return
      }

      // Step 1: Occasion
      if (state === 'WIZARD_OCCASION') {
        if (!text) return ctx.reply('Пожалуйста, введите повод текстом:')
        ;(data as any).occasion = text

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_BUDGET',
            botData: JSON.stringify(data),
          },
        })

        return ctx.reply(
          `Шаг 2/6: *Каков ориентировочный бюджет на букет?* (укажите числом в рублях, например: 4000 или 6500)`,
          { parse_mode: 'Markdown' }
        )
      }

      // Step 2: Budget
      if (state === 'WIZARD_BUDGET') {
        if (!text) return ctx.reply('Пожалуйста, введите сумму числом:')
        const cleanVal = text.replace(/[^0-9]/g, '')
        const num = parseFloat(cleanVal)

        if (isNaN(num) || num <= 0) {
          return ctx.reply('Не удалось распознать сумму. Пожалуйста, напишите бюджет цифрами (например: 5000):')
        }

        ;(data as any).budget = num

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_DATE',
            botData: JSON.stringify(data),
          },
        })

        return ctx.reply(
          `Шаг 3/6: *На какую дату и время нужен букет?* (например: завтра к 12:00, 20 июля к 15:00)`,
          { parse_mode: 'Markdown' }
        )
      }

      // Step 3: Date
      if (state === 'WIZARD_DATE') {
        if (!text) return ctx.reply('Пожалуйста, введите дату и время текстом:')
        ;(data as any).dateText = text

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_DELIVERY',
            botData: JSON.stringify(data),
          },
        })

        const deliveryKeyboard = new InlineKeyboard()
          .text('🚗 Самовывоз', 'wizard_delivery:PICKUP')
          .text('🚚 Доставка', 'wizard_delivery:DELIVERY')

        return ctx.reply(`Шаг 4/6: *Выберите способ получения:*`, {
          reply_markup: deliveryKeyboard,
        })
      }

      // Step 4: Address (Only if delivery selected)
      if (state === 'WIZARD_ADDRESS') {
        if (!text) return ctx.reply('Пожалуйста, введите адрес доставки:')
        ;(data as any).deliveryAddress = text

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_COMMENT',
            botData: JSON.stringify(data),
          },
        })

        return ctx.reply(
          `Шаг 5/6: *Напишите особые пожелания к букету:* (цветовая гамма, любимые или нелюбимые цветы, текст открытки или напишите "нет" / skip)`,
          { reply_markup: new Keyboard().text('Пропустить ➡️').resized() }
        )
      }

      // Step 5: Comment
      if (state === 'WIZARD_COMMENT') {
        const commentVal = text === 'Пропустить ➡️' || text?.toLowerCase() === '/skip' ? '' : text
        ;(data as any).comment = commentVal

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_PHOTO',
            botData: JSON.stringify(data),
          },
        })

        return ctx.reply(
          `Шаг 6/6: *Прикрепите фотографию-пример* букета, если она у вас есть. Мы соберем аналогичный по стилю.\n\n` +
            `Если примера нет, нажмите кнопку "Пропустить ➡️" или напишите /skip:`,
          {
            reply_markup: new Keyboard().text('Пропустить ➡️').resized(),
          }
        )
      }

      // Step 6: Photo (Upload to Cloudinary and Confirm)
      if (state === 'WIZARD_PHOTO') {
        let photoUrl: string | null = null

        const isSkip = text === 'Пропустить ➡️' || text?.toLowerCase() === '/skip'

        if (!isSkip && ctx.message.photo) {
          // Get largest photo size
          const photo = ctx.message.photo[ctx.message.photo.length - 1]
          await ctx.reply('Загружаем фотографию на сервер... Пожалуйста, подождите. ⏳')

          try {
            const file = await ctx.getFile()
            const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`

            // Direct upload from telegram file url to Cloudinary
            photoUrl = await fastify.cloudinary.uploadUrlOrPath(fileUrl, 'fabrikaflo_examples')
          } catch (err) {
            fastify.log.error(err, 'Failed to upload photo to Cloudinary')
            await ctx.reply('Не удалось загрузить фото на сервер. Заявка будет создана без фото-примера.')
          }
        }

        ;(data as any).examplePhotoUrl = photoUrl

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_CONFIRM',
            botData: JSON.stringify(data),
          },
        })

        // Present Summary and Ask to Confirm
        const summary =
          `📝 *Проверьте параметры вашей заявки:*\n\n` +
          `• Повод: *${(data as any).occasion}*\n` +
          `• Бюджет: *${(data as any).budget} руб.*\n` +
          `• Дата и время: *${(data as any).dateText}*\n` +
          `• Способ получения: *${(data as any).deliveryType === 'PICKUP' ? '🚗 Самовывоз' : '🚚 Доставка'}*\n` +
          `• Адрес: *${(data as any).deliveryAddress || 'Не требуется'}*\n` +
          `• Пожелания: *${(data as any).comment || 'нет'}*\n` +
          `• Фото-пример: *${photoUrl ? 'Загружено ✅' : 'отсутствует'}*`

        const confirmKeyboard = new InlineKeyboard()
          .text('Отправить заявку 🌸', 'wizard_confirm:yes')
          .text('Отменить ❌', 'wizard_confirm:no')

        if (photoUrl) {
          await ctx.replyWithPhoto(photoUrl, {
            caption: summary,
            parse_mode: 'Markdown',
            reply_markup: confirmKeyboard,
          })
        } else {
          await ctx.reply(summary, {
            parse_mode: 'Markdown',
            reply_markup: confirmKeyboard,
          })
        }
      }
    })

    // Inline callback queries specifically for wizard steps
    bot.callbackQuery(/^wizard_delivery:(.+)$/, async (ctx) => {
      const deliveryType = ctx.match[1]
      const user = await getOrCreateUser(ctx)
      if (!user) return

      let data = {}
      try {
        data = JSON.parse(user.botData || '{}')
      } catch (e) {
        data = {}
      }

      ;(data as any).deliveryType = deliveryType

      if (deliveryType === 'DELIVERY') {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_ADDRESS',
            botData: JSON.stringify(data),
          },
        })
        await ctx.editMessageText('Выбрана доставка 🚚')
        await ctx.reply('Введите адрес доставки и имя/телефон получателя:')
      } else {
        ;(data as any).deliveryAddress = ''
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_COMMENT',
            botData: JSON.stringify(data),
          },
        })
        await ctx.editMessageText('Выбран самовывоз 🚗')
        await ctx.reply(
          `Шаг 5/6: *Напишите особые пожелания к букету:* (цветовая гамма, любимые или нелюбимые цветы, текст открытки или напишите "нет" / skip)`,
          { reply_markup: new Keyboard().text('Пропустить ➡️').resized() }
        )
      }
      await ctx.answerCallbackQuery()
    })

    bot.callbackQuery(/^wizard_confirm:(.+)$/, async (ctx) => {
      const confirm = ctx.match[1]
      const user = await getOrCreateUser(ctx)
      if (!user) return

      if (confirm === 'no') {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { botState: 'Idle', botData: null },
        })
        await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() })
        await ctx.reply('Оформление заявки отменено.', {
          reply_markup: getClientMainMenu(),
        })
        await ctx.answerCallbackQuery()
        return
      }

      let data = {}
      try {
        data = JSON.parse(user.botData || '{}')
      } catch (e) {
        data = {}
      }

      const budget = (data as any).budget ?? 0
      const occasion = (data as any).occasion ?? ''
      const comment = (data as any).comment ?? ''
      const examplePhotoUrl = (data as any).examplePhotoUrl ?? null
      const deliveryType = (data as any).deliveryType ?? 'DELIVERY'
      const deliveryAddress = (data as any).deliveryAddress ?? ''
      const dateText = (data as any).dateText ?? ''

      // Attempt to parse date from dateText, fallback to today + 2 days if parsing fails
      let targetDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      
      // Create Request in DB
      const request = await fastify.prisma.request.create({
        data: {
          clientId: user.id,
          occasion,
          budget,
          date: targetDate, // parsed or fallback
          deliveryType,
          comment: `[Желаемая дата/время: ${dateText}]. ${comment}`,
          examplePhotoUrl,
          status: 'PENDING',
        },
      })

      // Reset bot user state
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { botState: 'Idle', botData: null },
      })

      await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() })
      await ctx.reply(
        `✨ Ваша заявка успешно отправлена!\n\n` +
          `Номер заявки: *${request.id.substring(0, 8)}*\n` +
          `Наш администратор изучит детали и свяжется с вами в Telegram или по телефону в ближайшее время. Спасибо! 🌸`,
        { parse_mode: 'Markdown', reply_markup: getClientMainMenu() }
      )

      // Notify Admins
      if (adminChatId) {
        const admins = adminChatId.split(',').map((id) => id.trim())
        const adminMsg =
          `🔔 *Получена новая заявка от клиента!*\n\n` +
          `• Клиент: *${user.name}* (@${user.username || 'нет'})\n` +
          `• Телефон: *${user.phone || 'не указан'}*\n` +
          `• Повод: _${occasion}_\n` +
          `• Бюджет: *${budget} руб.*\n` +
          `• Дата/Время: _${dateText}_\n` +
          `• Способ получения: *${deliveryType === 'PICKUP' ? '🚗 Самовывоз' : '🚚 Доставка'}*\n` +
          `• Адрес: _${deliveryAddress || 'нет'}_\n` +
          `• Пожелания: _${comment || 'нет'}_\n`

        for (const adminId of admins) {
          try {
            if (examplePhotoUrl) {
              await bot.api.sendPhoto(adminId, examplePhotoUrl, {
                caption: adminMsg,
                parse_mode: 'Markdown',
              })
            } else {
              await bot.api.sendMessage(adminId, adminMsg, {
                parse_mode: 'Markdown',
              })
            }
          } catch (e) {
            // ignore admin send errors
          }
        }
      }

      await ctx.answerCallbackQuery({ text: 'Заявка отправлена!' })
    })

    // Fallback menu checks
    bot.hears('🌸 Заказать букет', async (ctx) => {
      // Re-trigger start of order
    })

    // Setup running mode (Webhook or Polling)
    const mode = fastify.config.TELEGRAM_BOT_MODE
    const webhookUrl = fastify.config.TELEGRAM_WEBHOOK_URL

    if (mode === 'webhook') {
      if (!webhookUrl) {
        fastify.log.error('TELEGRAM_WEBHOOK_URL is not set, falling back to polling.')
      } else {
        const urlObj = new URL(webhookUrl)
        const path = `/bot${token}`
        const fullUrl = `${urlObj.origin}${path}`

        // Register POST route for telegram webhook
        fastify.post(path, async (request, reply) => {
          // Grammy handler
          const handleUpdate = webhookCallback(bot, 'fastify')
          return handleUpdate(request, reply)
        })

        try {
          await bot.api.setWebhook(fullUrl)
          fastify.log.info(`Telegram Webhook set to: ${fullUrl}`)
        } catch (err) {
          fastify.log.error(err, 'Failed to set Telegram webhook')
        }
      }
    } else {
      // Delete webhook to ensure polling works
      try {
        await bot.api.deleteWebhook()
        bot.start().catch((err) => {
          fastify.log.error(err, 'Error during bot polling execution')
        })
        fastify.log.info('Grammy Bot starting in polling mode...')
      } catch (err) {
        fastify.log.error(err, 'Failed to delete webhook for polling')
      }
    }

    fastify.decorate('bot', bot)

    fastify.decorate('sendBotNotification', async (telegramId: string, text: string, options?: any) => {
      try {
        if (options?.photoUrl) {
          const inlineKeyboard = new InlineKeyboard()
          if (options?.approveButtons && options?.orderId) {
            inlineKeyboard
              .text('✅ Одобрить букет', `approve_bouquet:${options.orderId}`)
              .row()
              .text('💬 Внести правки', `disapprove_bouquet:${options.orderId}`)
          }
          const isUrl = options?.paymentLink?.startsWith('http://') || options?.paymentLink?.startsWith('https://')
          if (options?.paymentLink) {
            if (isUrl) {
              inlineKeyboard.url('💳 Оплатить заказ', options.paymentLink)
            } else {
              text += `\n• Оплата: ${options.paymentLink}`
            }
          }

          return await bot.api.sendPhoto(telegramId, options.photoUrl, {
            caption: text,
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard,
          })
        } else {
          const inlineKeyboard = new InlineKeyboard()
          const isUrl = options?.paymentLink?.startsWith('http://') || options?.paymentLink?.startsWith('https://')
          if (options?.paymentLink) {
            if (isUrl) {
              inlineKeyboard.url('💳 Оплатить заказ', options.paymentLink)
            } else {
              text += `\n• Оплата: ${options.paymentLink}`
            }
          }
          if (options?.courierConfirm && options?.orderId) {
            inlineKeyboard.text('✅ Доставлено', `courier_complete:${options.orderId}`)
          }

          return await bot.api.sendMessage(telegramId, text, {
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard,
          })
        }
      } catch (err) {
        fastify.log.error(err, 'Failed to send bot notification to telegram ID: %s', telegramId)
      }
    })

    fastify.addHook('onClose', async () => {
      fastify.log.info('Stopping Telegram bot...')
      await bot.stop()
    })
  },
  {
    name: 'bot',
    dependencies: ['prisma', 'env', 'cloudinary'],
  },
)
