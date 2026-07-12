import type { FastifyInstance } from 'fastify'

// Helper to find or create User from context
export async function getOrCreateUser(fastify: FastifyInstance, ctx: any, adminChatId?: string) {
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
        tgname: ctx.from?.username ?? null,
        name: `${ctx.from?.first_name ?? ''} ${ctx.from?.last_name ?? ''}`.trim() || 'Client',
        role: isAdmin ? 'ADMIN' : 'CLIENT',
      },
    })
  } else {
    // Keep profile updated
    user = await fastify.prisma.user.update({
      where: { telegramId: tgId },
      data: {
        tgname: ctx.from?.username ?? user.tgname,
        name: `${ctx.from?.first_name ?? ''} ${ctx.from?.last_name ?? ''}`.trim() || user.name,
      },
    })
  }

  return user
}

// Parse date from dateText, return null if parsing fails
export function parseDateText(dateText: string): Date | null {
  if (!dateText || dateText.trim() === '') return null

  const lowerText = dateText.toLowerCase()
  const parsedDate = new Date()
  let isParsed = false

  if (lowerText.includes('сегодня')) {
    isParsed = true
    // keep today
  } else if (lowerText.includes('завтра') && !lowerText.includes('послезавтра')) {
    parsedDate.setDate(parsedDate.getDate() + 1)
    isParsed = true
  } else if (lowerText.includes('послезавтра')) {
    parsedDate.setDate(parsedDate.getDate() + 2)
    isParsed = true
  } else {
    // Try parsing formats like "20.07" or "20 июля"
    const dayMonthMatch = lowerText.match(/(\d{1,2})[\s.](сегодня|завтра|янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек|\d{1,2})/i)
    if (dayMonthMatch) {
      const day = parseInt(dayMonthMatch[1], 10)
      const monthText = dayMonthMatch[2]
      let month = parsedDate.getMonth()
      
      if (/\d+/.test(monthText)) {
        month = parseInt(monthText, 10) - 1
      } else {
        const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
        const foundIndex = months.findIndex(m => monthText.startsWith(m))
        if (foundIndex !== -1) {
          month = foundIndex
        }
      }
      parsedDate.setMonth(month)
      parsedDate.setDate(day)
      isParsed = true
    }
  }

  if (isParsed) {
    // Set default time to 12:00 if not specified
    parsedDate.setHours(12, 0, 0, 0)

    // Try parsing time (e.g. 15:30 or 15.30 or к 15)
    const timeMatch = lowerText.match(/(?:к\s+)?(\d{1,2})[:.](\d{2})/)
    if (timeMatch) {
      const hrs = parseInt(timeMatch[1], 10)
      const mins = parseInt(timeMatch[2], 10)
      parsedDate.setHours(hrs, mins, 0, 0)
    } else {
      const hourOnlyMatch = lowerText.match(/(?:к\s+|в\s+)(\d{1,2})\s*(?:ч|около|$)/)
      if (hourOnlyMatch) {
        const hrs = parseInt(hourOnlyMatch[1], 10)
        parsedDate.setHours(hrs, 0, 0, 0)
      }
    }
    return parsedDate
  }

  return null
}
