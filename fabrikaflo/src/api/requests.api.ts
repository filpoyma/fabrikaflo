import api from './baseApi.ts'
import type { IRequest } from '../types'

export const requestsApi = {
  async list() {
    return api.get('requests').json<{ data: IRequest[] }>()
  },
  async get(id: string) {
    return api.get(`requests/${id}`).json<{ data: IRequest }>()
  },
  async updateStatus(id: string, status: string) {
    return api.put(`requests/${id}/status`, { json: { status } }).json<{ data: IRequest }>()
  },
  async convert(id: string, data: {
    recipientName?: string
    recipientPhone?: string
    deliveryAddress?: string
    deliveryTime?: string
    postcardText?: string
    comment?: string
    wishes?: string
    budget: number
  }) {
    return api.post(`requests/${id}/convert`, { json: data }).json<{ success: boolean; orderId: string }>()
  },
}
