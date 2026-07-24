import type { DeliveryType } from '../../../generated/prisma/client.ts'
import type { FastifyInstance } from 'fastify'
import type { Bot, Context } from 'grammy'
import { InlineKeyboard, Keyboard } from 'grammy'
import { getClientMainMenu } from './keyboards.ts'
import { getOrCreateUser, parseDateText } from './utils.ts'
import { parseWizardData, type TWizardData } from './wizard.types.ts'

function getMessageText(ctx: Context): string | undefined {
  const message = ctx.message
  if (message && 'text' in message) return message.text
  return undefined
}

function getStepsTotal(data: TWizardData, fullFlowSteps: string): string {
  return data.isPortfolioOrder ? '5' : fullFlowSteps
}

function buildWizardSummary(data: TWizardData, userPhone: string | null, options?: {
  postcardText?: string
  photoUrl?: string | null
}): string {
  const postcardText = options?.postcardText ?? data.postcardText
  const photoUrl = options?.photoUrl

  let summary =
    `📝 *Проверьте параметры вашей заявки:*\n\n` +
    `• Повод: *${data.occasion ?? ''}*\n` +
    `• Бюджет: *${data.budget ?? 0} руб.*\n` +
    `• Дата и время: *${data.dateText ?? ''}*\n` +
    `• Способ получения: *${data.deliveryType === 'PICKUP' ? '🚗 Самовывоз' : '🚚 Доставка'}*\n` +
    `• Адрес: *${data.deliveryAddress || 'Не требуется'}*\n` +
    `• Телефон получателя: *${data.recipientPhone || userPhone || 'Не указан'}*\n` +
    `• Пожелания: *${data.comment || 'нет'}*\n` +
    `• Текст открытки: *${postcardText || 'не требуется'}*\n`

  if (data.isPortfolioOrder) {
    summary += `• Выбранный букет: *${data.portfolioTitle || 'из галереи'}*`
  } else {
    summary += `• Фото-пример: *${photoUrl ? 'Загружено ✅' : 'отсутствует'}*`
  }

  return summary
}

export function registerWizardHandlers(
  bot: Bot,
  fastify: FastifyInstance,
  token: string,
  adminChatId?: string,
) {
  bot.hears('🌸 Заказать букет', async (ctx) => {
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
    if (!user) return

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
      { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } },
    )
  })

  bot.on('message', async (ctx) => {
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
    if (!user) return

    const state = user.botState
    if (!state || state === 'Idle') return

    const text = getMessageText(ctx)
    const data = parseWizardData(user.botData)

    if (state === 'DISAPPROVE_FEEDBACK') {
      const orderId = data.orderId
      if (!orderId) {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { botState: 'Idle', botData: null },
        })
        return ctx.reply('Ошибка сессии. Пожалуйста, попробуйте еще раз.')
      }

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

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { botState: 'Idle', botData: null },
      })

      await ctx.reply(
        `Правки приняты и переданы флористу! 🌸 Мы доработаем букет и пришлем вам новое фото.`,
        { reply_markup: getClientMainMenu(fastify.config.MINI_APP_URL) },
      )

      if (adminChatId) {
        const admins = adminChatId.split(',').map((id) => id.trim())
        for (const adminId of admins) {
          try {
            await bot.api.sendMessage(
              adminId,
              `⚠️ Клиент отклонил букет по заказу на ${order?.budget} руб. и внес правки:\n` +
                `_"${text}"_\n` +
                `Заказ переведен обратно в статус сборки (ASSEMBLING).`,
            )
          } catch (err) {
            fastify.log.error(
              err,
              'Failed to notify admin %s about bouquet disapproval for order %s',
              adminId,
              order?.id,
            )
          }
        }
      }
      return
    }

    if (state === 'WIZARD_OCCASION') {
      if (!text) return ctx.reply('Пожалуйста, введите повод текстом:')
      data.occasion = text

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          botState: 'WIZARD_BUDGET',
          botData: JSON.stringify(data),
        },
      })

      return ctx.reply(
        `Шаг 2/${getStepsTotal(data, '6')}: *Каков ориентировочный бюджет на букет?* (укажите числом в рублях, например: 4000 или 6500)`,
        { parse_mode: 'Markdown' },
      )
    }

    if (state === 'WIZARD_BUDGET') {
      if (!text) return ctx.reply('Пожалуйста, введите сумму числом:')
      const cleanVal = text.replace(/[^0-9]/g, '')
      const num = parseFloat(cleanVal)

      if (Number.isNaN(num) || num <= 0) {
        return ctx.reply('Не удалось распознать сумму. Пожалуйста, напишите бюджет цифрами (например: 5000):')
      }

      data.budget = num

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          botState: 'WIZARD_DATE',
          botData: JSON.stringify(data),
        },
      })

      return ctx.reply(
        `Шаг 3/${getStepsTotal(data, '6')}: *На какую дату и время нужен букет?* (например: завтра к 12:00, 20 июля к 15:00)`,
        { parse_mode: 'Markdown' },
      )
    }

    if (state === 'WIZARD_DATE') {
      if (!text) return ctx.reply('Пожалуйста, введите дату и время текстом:')
      data.dateText = text

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

      return ctx.reply(`Шаг 4/${getStepsTotal(data, '6')}: *Выберите способ получения:*`, {
        reply_markup: deliveryKeyboard,
      })
    }

    if (state === 'WIZARD_ADDRESS') {
      if (!text) return ctx.reply('Пожалуйста, введите адрес доставки:')
      data.deliveryAddress = text

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          botState: 'WIZARD_COMMENT',
          botData: JSON.stringify(data),
        },
      })

      return ctx.reply(
        `Шаг 5/${getStepsTotal(data, '7')}: *Напишите особые пожелания к букету:* (цветовая гамма, любимые или нелюбимые цветы, или напишите "нет" / skip)`,
        { reply_markup: new Keyboard().text('Пропустить ➡️').resized() },
      )
    }

    if (state === 'WIZARD_PHONE') {
      let phoneVal = ''
      const message = ctx.message
      if (message && 'contact' in message && message.contact) {
        phoneVal = message.contact.phone_number
      } else if (text) {
        const phoneMatch = text.match(/(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/)
        phoneVal = phoneMatch ? phoneMatch[0].trim() : text
      }

      if (!phoneVal) {
        return ctx.reply('Пожалуйста, введите корректный номер телефона или отправьте контакт:')
      }

      data.recipientPhone = phoneVal

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

      return ctx.reply(
        `Шаг 5/${getStepsTotal(data, '7')}: *Напишите особые пожелания к букету:* (цветовая гамма, любимые или нелюбимые цветы, или напишите "нет" / skip)`,
        { reply_markup: new Keyboard().text('Пропустить ➡️').resized() },
      )
    }

    if (state === 'WIZARD_COMMENT') {
      const commentVal = text === 'Пропустить ➡️' || text?.toLowerCase() === '/skip' ? '' : (text ?? '')
      data.comment = commentVal

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          botState: 'WIZARD_POSTCARD',
          botData: JSON.stringify(data),
        },
      })

      return ctx.reply(
        `Шаг 6/${getStepsTotal(data, '7')}: *Нужно ли приложить открытку к букету?*\n\n` +
          `Напишите текст открытки, который мы перенесем на фирменную карточку, или нажмите кнопку "Пропустить ➡️":`,
        { reply_markup: new Keyboard().text('Пропустить ➡️').resized() },
      )
    }

    if (state === 'WIZARD_POSTCARD') {
      const postcardVal = text === 'Пропустить ➡️' || text?.toLowerCase() === '/skip' ? '' : (text ?? '')
      data.postcardText = postcardVal

      if (data.isPortfolioOrder) {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            botState: 'WIZARD_CONFIRM',
            botData: JSON.stringify(data),
          },
        })

        const summary = buildWizardSummary(data, user.phone, { postcardText: postcardVal })
        const confirmKeyboard = new InlineKeyboard()
          .text('Отправить заявку 🌸', 'wizard_confirm:yes')
          .text('Отменить ❌', 'wizard_confirm:no')

        if (data.examplePhotoUrl) {
          return ctx.replyWithPhoto(data.examplePhotoUrl, {
            caption: summary,
            parse_mode: 'Markdown',
            reply_markup: confirmKeyboard,
          })
        }

        return ctx.reply(summary, {
          parse_mode: 'Markdown',
          reply_markup: confirmKeyboard,
        })
      }

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
        },
      )
    }

    if (state === 'WIZARD_PHOTO') {
      let photoUrl: string | null = null
      const isSkip = text === 'Пропустить ➡️' || text?.toLowerCase() === '/skip'
      const message = ctx.message

      if (!isSkip && message && 'photo' in message && message.photo && message.photo.length > 0) {
        await ctx.reply('Загружаем фотографию на сервер... Пожалуйста, подождите. ⏳')

        try {
          const file = await ctx.getFile()
          const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`
          photoUrl = await fastify.cloudinary.uploadUrlOrPath(fileUrl, 'fabrikaflo_examples')
        } catch (err) {
          fastify.log.error(err, 'Failed to upload photo to Cloudinary')
          await ctx.reply('Не удалось загрузить фото на сервер. Заявка будет создана без фото-примера.')
        }
      }

      data.examplePhotoUrl = photoUrl

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          botState: 'WIZARD_CONFIRM',
          botData: JSON.stringify(data),
        },
      })

      const summary = buildWizardSummary(data, user.phone, { photoUrl })
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

  bot.callbackQuery(/^wizard_delivery:(.+)$/, async (ctx) => {
    const deliveryType = ctx.match[1]
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
    if (!user) return

    const data = parseWizardData(user.botData)
    data.deliveryType = deliveryType

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
      data.deliveryAddress = ''
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
        },
      )
    }
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery(/^wizard_confirm:(.+)$/, async (ctx) => {
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

    const data = parseWizardData(user.botData)
    const budget = data.budget ?? 0
    const occasion = data.occasion ?? ''
    const comment = data.comment ?? ''
    const examplePhotoUrl = data.examplePhotoUrl ?? null
    const deliveryType = data.deliveryType ?? 'DELIVERY'
    const deliveryAddress = data.deliveryAddress ?? null
    const dateText = data.dateText ?? ''
    const postcardText = data.postcardText ?? null

    let recipientPhone = data.recipientPhone ?? null
    if (!recipientPhone && deliveryAddress) {
      const phoneMatch = deliveryAddress.match(
        /(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/,
      )
      if (phoneMatch) {
        recipientPhone = phoneMatch[0].trim()
      }
    }
    if (!recipientPhone) {
      recipientPhone = user.phone ?? null
    }

    if (recipientPhone && !user.phone) {
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { phone: recipientPhone },
      })
    }

    const targetDate = parseDateText(dateText)

    const request = await fastify.prisma.request.create({
      data: {
        clientId: user.id,
        occasion,
        budget,
        date: targetDate,
        deliveryType: deliveryType as DeliveryType,
        deliveryAddress,
        recipientPhone,
        postcardText,
        comment: `[Желаемая дата/время: ${dateText}]. ${comment}`,
        examplePhotoUrl,
        status: 'PENDING',
      },
    })

    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { botState: 'Idle', botData: null },
    })

    await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard() })
    await ctx.reply(
      `✨ Ваша заявка успешно отправлена!\n\n` +
        `Номер заявки: *${request.id.substring(0, 8)}*\n` +
        `Наш администратор изучит детали и свяжется с вами в Telegram или по телефону в ближайшее время. Спасибо! 🌸`,
      { parse_mode: 'Markdown', reply_markup: getClientMainMenu(fastify.config.MINI_APP_URL) },
    )

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
        } catch (err) {
          fastify.log.error(err, 'Failed to notify admin %s about new request', adminId)
        }
      }
    }

    await ctx.answerCallbackQuery({ text: 'Заявка отправлена!' })
  })
}
