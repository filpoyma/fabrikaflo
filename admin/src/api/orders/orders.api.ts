import api from '../baseApi.ts'
import type { IOrder } from '../../types'

export const ordersApi = {
  async list() {
    return api.get('orders').json<{ data: IOrder[] }>()
  },
  async get(id: string) {
    return api.get(`orders/${id}`).json<{ data: IOrder }>()
  },
  async createDirect(data: {
    clientId: string
    recipientName?: string
    recipientPhone?: string
    deliveryAddress?: string
    deliveryTime?: string
    budget: number
    wishes?: string
    postcardText?: string
    comment?: string
  }) {
    return api.post('orders', { json: data }).json<{ data: IOrder }>()
  },
  async updateStatus(id: string, status: string) {
    return api.put(`orders/${id}/status`, { json: { status } }).json<{ data: IOrder }>()
  },
  async uploadPhoto(id: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`orders/${id}/photos`, { body: formData }).json<{ data: IOrder }>()
  },
  async sendApproval(id: string) {
    return api.post(`orders/${id}/send-approval`).json<{ success: boolean; status: string }>()
  },
  async sendPayment(id: string, paymentLink: string) {
    return api
      .post(`orders/${id}/send-payment`, { json: { paymentLink } })
      .json<{ success: boolean; status: string }>()
  },
  async assignCourier(id: string, courierId: string) {
    return api
      .post(`orders/${id}/assign-courier`, { json: { courierId } })
      .json<{ success: boolean; status: string }>()
  },
}
