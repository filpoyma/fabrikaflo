import api from '../baseApi.ts'
import type { IOrder } from '../../types/domain.ts'

export const ordersApi = {
  async listMy(): Promise<{ data: IOrder[] }> {
    return api.get('orders/my').json()
  },
  async getMy(id: string): Promise<{ data: IOrder }> {
    return api.get(`orders/my/${id}`).json()
  },
  async approve(id: string): Promise<{ success: boolean; status: string }> {
    return api.post(`orders/my/${id}/approve`).json()
  },
  async disapprove(id: string, feedback: string): Promise<{ success: boolean; status: string }> {
    return api.post(`orders/my/${id}/disapprove`, { json: { feedback } }).json()
  },
  async uploadReceipt(orderId: string, file: File): Promise<{ success: boolean }> {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`orders/my/${orderId}/receipt`, { body: formData }).json()
  },
  async repeat(orderId: string): Promise<{ success: boolean }> {
    return api.post(`orders/my/${orderId}/repeat`).json()
  },
}
