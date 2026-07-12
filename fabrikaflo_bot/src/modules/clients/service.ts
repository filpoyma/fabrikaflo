import type { FastifyInstance } from 'fastify'

export function createClientsService(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  return {
    async getClientsCRM() {
      const users = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
        },
        include: {
          clientOrders: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return users.map((user) => {
        const orders = user.clientOrders
        const validOrders = orders.filter((o) => o.status !== 'CANCELLED')
        const totalSpend = validOrders.reduce((sum, o) => sum + o.budget, 0)
        const ordersCount = orders.length
        const averageCheck =
          ordersCount > 0 ? parseFloat((totalSpend / ordersCount).toFixed(2)) : 0

        return {
          id: user.id,
          telegramId: user.telegramId,
          tgname: user.tgname,
          name: user.name,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          ordersCount,
          totalSpend,
          averageCheck,
        }
      })
    },

    async getCouriers() {
      return prisma.user.findMany({
        where: {
          role: 'COURIER',
        },
        orderBy: { name: 'asc' },
      })
    },

    async getProfile(userId: string) {
      return prisma.user.findUnique({
        where: { id: userId },
      })
    },

    async updateProfile(userId: string, data: { name?: string; phone?: string }) {
      return prisma.user.update({
        where: { id: userId },
        data,
      })
    },
  }
}
