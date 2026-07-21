import type { FastifyInstance } from 'fastify'
import { InlineKeyboard, Keyboard } from 'grammy'
import { getOrCreateUser, parseDateText } from './utils.ts'
import { getClientMainMenu } from './keyboards.ts'

export function registerWizardHandlers(
  bot: any,
  fastify: FastifyInstance,
  token: string,
  adminChatId?: string
) {
  // Step-by-step Conversation Wizard Logic for client bouquet order requests
  bot.hears('🌸 Заказать букет', async (ctx: any) => {
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
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
  bot.on('message', async (ctx: any, next: any) => {
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
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

      // Add client wishes to order clientFeedback and change status back to ASSEMBLING
      const order = await fastify.prisma.order.findUnique({ where: { id: orderId } })
      const feedbackComment = text || ''
      const updatedFeedback = order?.clientFeedback
        ? `${order.clientFeedback}\n${feedbackComment}`
        : feedbackComment

      await fastify.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'ASSEMBLING',
          clientFeedback: updatedFeedback,
        },
      })

      // Clear user state
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { botState: 'Idle', botData: null },
      })

      await ctx.reply(
        `Правки приняты и переданы флористу! 🌸 Мы доработаем букет и пришлем вам новое фото.`,
        { reply_markup: getClientMainMenu(fastify.config.MINI_APP_URL) }
      )

      // Notify Admins
      if (adminChatId) {
        const admins = adminChatId.split(',').map((id) => id.trim())
        for (const adminId of admins) {
          try {
            await bot.api.sendMessage(
              adminId,
              `⚠️ Клиент отклонил букет по заказу на ${order?.budget} руб. и внес правки:\n` +
                `_"${text}"_\n` +
                `Заказ переведен обратно в статус сборки (ASSEMBLING).`
            )
          } catch (e) {
            // Ignore
          }
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

      const stepsTotal = (data as any).isPortfolioOrder ? '5' : '6'
      return ctx.reply(
        `Шаг 2/${stepsTotal}: *Каков ориентировочный бюджет на букет?* (укажите числом в рублях, например: 4000 или 6500)`,
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

      const stepsTotal = (data as any).isPortfolioOrder ? '5' : '6'
      return ctx.reply(
        `Шаг 3/${stepsTotal}: *На какую дату и время нужен букет?* (например: завтра к 12:00, 20 июля к 15:00)`,
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

      const stepsTotal = (data as any).isPortfolioOrder ? '5' : '6'
      return ctx.reply(`Шаг 4/${stepsTotal}: *Выберите способ получения:*`, {
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

        const stepsTotal = (data as any).isPortfolioOrder ? '6' : '7'
        return ctx.reply(
          `Шаг 5/${stepsTotal}: *Напишите особые пожелания к букету:* (цветовая гамма, любимые или нелюбимые цветы, или напишите "нет" / skip)`,
          { reply_markup: new Keyboard().text('Пропустить ➡️').resized() }
        )
      }

      // Step 4b: Phone (Only if pickup selected)
      if (state === 'WIZARD_PHONE') {
        let phoneVal = ''
        if (ctx.message.contact) {
          phoneVal = ctx.message.contact.phone_number
        } else if (text) {
          const phoneMatch = text.match(/(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/)
          phoneVal = phoneMatch ? phoneMatch[0].trim() : text
        }

        if (!phoneVal) {
          return ctx.reply('Пожалуйста, введите корректный номер телефона или отправьте контакт:')
        }

        ;(data as any).recipientPhone = phoneVal

        // Save phone to user profile as well
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { phone: phoneVal },
        })

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_COMMENT',
            botData: JSON.stringify(data),
          },
        })

        const stepsTotal = (data as any).isPortfolioOrder ? '6' : '7'
        return ctx.reply(
          `Шаг 5/${stepsTotal}: *Напишите особые пожелания к букету:* (цветовая гамма, любимые или нелюбимые цветы, или напишите "нет" / skip)`,
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
          botState: 'WIZARD_POSTCARD',
          botData: JSON.stringify(data),
        },
      })

      const stepsTotal = (data as any).isPortfolioOrder ? '6' : '7'
      return ctx.reply(
        `Шаг 6/${stepsTotal}: *Нужно ли приложить открытку к букету?*\n\n` +
          `Напишите текст открытки, который мы перенесем на фирменную карточку, или нажмите кнопку "Пропустить ➡️":`,
        { reply_markup: new Keyboard().text('Пропустить ➡️').resized() }
      )
    }

    // Step 6: Postcard
    if (state === 'WIZARD_POSTCARD') {
      const postcardVal = text === 'Пропустить ➡️' || text?.toLowerCase() === '/skip' ? '' : text
      ;(data as any).postcardText = postcardVal

      if ((data as any).isPortfolioOrder) {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_CONFIRM',
            botData: JSON.stringify(data),
          },
        })

        const photoUrl = (data as any).examplePhotoUrl
        const summary =
          `📝 *Проверьте параметры вашей заявки:*\n\n` +
          `• Повод: *${(data as any).occasion}*\n` +
          `• Бюджет: *${(data as any).budget} руб.*\n` +
          `• Дата и время: *${(data as any).dateText}*\n` +
          `• Способ получения: *${(data as any).deliveryType === 'PICKUP' ? '🚗 Самовывоз' : '🚚 Доставка'}*\n` +
          `• Адрес: *${(data as any).deliveryAddress || 'Не требуется'}*\n` +
          `• Телефон получателя: *${(data as any).recipientPhone || user.phone || 'Не указан'}*\n` +
          `• Пожелания: *${(data as any).comment || 'нет'}*\n` +
          `• Текст открытки: *${postcardVal || 'не требуется'}*\n` +
          `• Выбранный букет: *${(data as any).portfolioTitle || 'из галереи'}*`

        const confirmKeyboard = new InlineKeyboard()
          .text('Отправить заявку 🌸', 'wizard_confirm:yes')
          .text('Отменить ❌', 'wizard_confirm:no')

        if (photoUrl) {
          return ctx.replyWithPhoto(photoUrl, {
            caption: summary,
            parse_mode: 'Markdown',
            reply_markup: confirmKeyboard,
          })
        } else {
          return ctx.reply(summary, {
            parse_mode: 'Markdown',
            reply_markup: confirmKeyboard,
          })
        }
      } else {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_PHOTO',
            botData: JSON.stringify(data),
          },
        })

        return ctx.reply(
          `Шаг 7/7: *Прикрепите фотографию-пример* букета, если она у вас есть. Мы соберем аналогичный по стилю.\n\n` +
            `Если примера нет, нажмите кнопку "Пропустить ➡️" или напишите /skip:`,
          {
            reply_markup: new Keyboard().text('Пропустить ➡️').resized(),
          }
        )
      }
    }

    // Step 7: Photo (Upload to Cloudinary and Confirm)
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
        `• Телефон получателя: *${(data as any).recipientPhone || user.phone || 'Не указан'}*\n` +
        `• Пожелания: *${(data as any).comment || 'нет'}*\n` +
        `• Текст открытки: *${(data as any).postcardText || 'не требуется'}*\n` +
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
  bot.callbackQuery(/^wizard_delivery:(.+)$/, async (ctx: any) => {
    const deliveryType = ctx.match[1]
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
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
      await ctx.reply('Введите имя, телефон получателя и адрес доставки:')
    } else {
      ;(data as any).deliveryAddress = ''
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          botState: 'WIZARD_PHONE',
          botData: JSON.stringify(data),
        },
      })
      await ctx.editMessageText('Выбран самовывоз 🚗')
      await ctx.reply(
        'Пожалуйста, введите ваш контактный номер телефона для связи (или отправьте его кнопкой ниже):',
        {
          reply_markup: new Keyboard()
            .requestContact('📱 Отправить контакт')
            .resized()
            .oneTime(),
        }
      )
    }
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery(/^wizard_confirm:(.+)$/, async (ctx: any) => {
    const confirm = ctx.match[1]
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
    if (!user) return

    if (confirm === 'no') {
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { botState: 'Idle', botData: null },
      })
      await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() })
      await ctx.reply('Оформление заявки отменено.', {
        reply_markup: getClientMainMenu(fastify.config.MINI_APP_URL),
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
    const deliveryAddress = (data as any).deliveryAddress ?? null
    const dateText = (data as any).dateText ?? ''
    const postcardText = (data as any).postcardText ?? null

    let recipientPhone = (data as any).recipientPhone ?? null
    if (!recipientPhone && deliveryAddress) {
      const phoneMatch = deliveryAddress.match(/(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/)
      if (phoneMatch) {
        recipientPhone = phoneMatch[0].trim()
      }
    }
    if (!recipientPhone) {
      recipientPhone = user.phone ?? null
    }

    // Save phone to user profile if we have it now but didn't have it before
    if (recipientPhone && !user.phone) {
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { phone: recipientPhone },
      })
    }

    const targetDate = parseDateText(dateText)

    // Create Request in DB
    const request = await fastify.prisma.request.create({
      data: {
        clientId: user.id,
        occasion,
        budget,
        date: targetDate, // parsed or null
        deliveryType,
        deliveryAddress,
        recipientPhone,
        postcardText,
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
      { parse_mode: 'Markdown', reply_markup: getClientMainMenu(fastify.config.MINI_APP_URL) }
    )

    // Notify Admins
    if (adminChatId) {
      const admins = adminChatId.split(',').map((id) => id.trim())
      const adminMsg =
        `🔔 *Получена новая заявка от клиента!*\n\n` +
        `• Клиент: *${user.name}* (@${user.tgname || 'нет'})\n` +
        `• Телефон: *${user.phone || 'не указан'}*\n` +
        `• Повод: _${occasion}_\n` +
        `• Бюджет: *${budget} руб.*\n` +
        `• Дата/Время: _${dateText}_\n` +
        `• Способ получения: *${deliveryType === 'PICKUP' ? '🚗 Самовывоз' : '🚚 Доставка'}*\n` +
        `• Адрес: _${deliveryAddress || 'нет'}_\n` +
        `• Пожелания: _${comment || 'нет'}_\n` +
        `• Открытка: _${postcardText || 'не требуется'}_\n`

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
}
