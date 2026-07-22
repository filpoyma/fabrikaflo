import api from '../baseApi.ts'
import type { IFlowerInquiry } from '../../types/inquiry'
import type { TOrderDetailsPayload } from '../../types/order'

export type TConvertInquiryToOrderPayload = TOrderDetailsPayload

export const requestsApi = {
  async list(): Promise<{ data: IFlowerInquiry[] }> {
    return api.get('requests').json()
  },
  async get(id: string): Promise<{ data: IFlowerInquiry }> {
    return api.get(`requests/${id}`).json()
  },
  async updateStatus(id: string, status: string): Promise<{ data: IFlowerInquiry }> {
    return api.put(`requests/${id}/status`, { json: { status } }).json()
  },
  async convert(id: string, data: TConvertInquiryToOrderPayload): Promise<{ success: boolean; orderId: string }> {
    return api.post(`requests/${id}/convert`, { json: data }).json()
  },
}
