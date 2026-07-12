import type { Bot } from 'grammy'
import type { FastifyInstance } from 'fastify'
import { InlineKeyboard } from 'grammy'
import { getOrCreateUser } from './utils.ts'

export function registerPortfolioHandlers(bot: any, fastify: FastifyInstance, adminChatId?: string) {
  // Portfolio navigator (Interactive "Наши работы")
  bot.hears('❤️ Наши работы', async (ctx: any) => {
    const items = await fastify.prisma.portfolioItem.findMany({
      orderBy: { createdAt: 'desc' },
    })

    if (items.length === 0) {
      return ctx.reply('В данный момент галерея пуста. Скоро администратор добавит новые работы! 🌸')
    }

    // Show first item
    const item = items[0]
    const keyboard = new InlineKeyboard()
      .text('🌸 Заказать этот!', `portfolio_order:${item.id}`)
    keyboard.text('❌', 'portfolio:close')
    if (items.length > 1) {
      keyboard.text('▶️', 'portfolio:1')
    }

    const caption = `*${item.title || 'Наши работы'}*\n${item.description || ''}\n\n[1 / ${items.length}]`
    await ctx.replyWithPhoto(item.photoUrl, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  })

  // Callback query for viewing next/prev/close in portfolio
  bot.callbackQuery(/^portfolio:(.+)$/, async (ctx: any) => {
    const action = ctx.match[1]
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
      .text('🌸 Заказать этот!', `portfolio_order:${item.id}`)
    if (index > 0) {
      keyboard.text('◀️', `portfolio:${index - 1}`)
    }
    keyboard.text('❌', 'portfolio:close')
    if (index < items.length - 1) {
      keyboard.text('▶️', `portfolio:${index + 1}`)
    }

    const caption = `*${item.title || 'Наши работы'}*\n${item.description || ''}\n\n[${index + 1} / ${items.length}]`

    try {
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
  })

  // Callback query for ordering selected bouquet from portfolio
  bot.callbackQuery(/^portfolio_order:(.+)$/, async (ctx: any) => {
    const itemId = ctx.match[1]
    const user = await getOrCreateUser(fastify, ctx, adminChatId)
    if (!user) return

    const item = await fastify.prisma.portfolioItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return ctx.answerCallbackQuery({ text: 'Букет не найден.' })
    }

    const wizardData = {
      isPortfolioOrder: true,
      portfolioTitle: item.title,
      examplePhotoUrl: item.photoUrl,
    }

    await fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        botState: 'WIZARD_OCCASION',
        botData: JSON.stringify(wizardData),
      },
    })

    await ctx.answerCallbackQuery()
    await ctx.reply(
      `Отличный выбор! Начнем оформление заявки на букет «${item.title || 'из галереи'}»! 🌸\n\n` +
        `Шаг 1/5: *Для какого повода нужен букет?* (например: День рождения мамы, годовщина, признание в любви, свидание)`,
      { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }
    )
  })
}
