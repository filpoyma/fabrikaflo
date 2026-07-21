import api from '../baseApi.ts'
import type { IOrder } from '../../types/domain.ts'

type OrdersResponse = { data?: IOrder[] }
type OrderResponse = { data?: IOrder }

export const ordersApi = {
  async listMy(): Promise<IOrder[]> {
    const response = await api.get('orders/my').json<OrdersResponse>()
    return response.data || []
  },
  async getMy(id: string) {
    const response = await api.get(`orders/my/${id}`).json<OrderResponse>()
    return response.data
  },
  async approve(id: string) {
    return api.post(`orders/my/${id}/approve`).json()
  },
  async disapprove(id: string, feedback: string) {
    return api.post(`orders/my/${id}/disapprove`, { json: { feedback } }).json()
  },
  async uploadReceipt(orderId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`orders/my/${orderId}/receipt`, { body: formData }).json()
  },
  async repeat(orderId: string) {
    return api.post(`orders/my/${orderId}/repeat`).json()
  },
}
