import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { ordersRoutes } from './routes.ts'

const orders: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.register(ordersRoutes)
}

export default orders
