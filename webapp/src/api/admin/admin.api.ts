import api, { requestSafe } from '../baseApi.ts'
import type { IOrder, IRequest } from '../../types/domain.ts'
import type { IAdminSettings, IProduct, IProductInput } from '../../types/webapp.ts'
import { galleryApi } from '../gallery/gallery.api.ts'

export const adminApi = {
  async getOrders(status?: string): Promise<{ data: IOrder[] }> {
    const qs = status ? `?status=${status}` : ''
    return api.get(`orders${qs}`).json()
  },
  async updateOrder(id: string, status: string): Promise<{ data: IOrder }> {
    return api.put(`orders/${id}/status`, { json: { status } }).json()
  },
  async getRequests(): Promise<{ data: IRequest[] }> {
    return api.get('requests').json()
  },
  async convertRequest(id: string, data: Record<string, unknown>): Promise<{ success: boolean; orderId: string }> {
    return api.post(`requests/${id}/convert`, { json: data }).json()
  },
  async getProducts(): Promise<IProduct[]> {
    return galleryApi.list()
  },
  async uploadImage(file: File): Promise<{ ok: true; url: string }> {
    return galleryApi.uploadImage(file)
  },
  async createProduct(data: IProductInput): Promise<IProduct> {
    return galleryApi.create(data)
  },
  async updateProduct(id: string, data: IProductInput): Promise<IProduct> {
    return galleryApi.update(id, data)
  },
  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return galleryApi.delete(id)
  },
  async toggleProduct(_id: string): Promise<{ ok: true }> {
    return { ok: true }
  },
  async updateProductStock(_id: string, _data: Record<string, unknown>): Promise<{ ok: true }> {
    return { ok: true }
  },
  async createCategory(_data: Record<string, unknown>): Promise<{ ok: true }> {
    return { ok: true }
  },
  async deleteCategory(_slug: string): Promise<{ ok: true }> {
    return { ok: true }
  },
  async addTeamMember(data: Record<string, unknown>): Promise<{ ok: true }> {
    return requestSafe(() => api.post('team', { json: data }).json(), { ok: true })
  },
  async deleteTeamMember(id: string): Promise<{ ok: true }> {
    return requestSafe(() => api.delete(`team/${id}`).json(), { ok: true })
  },
  async getTeamMembers(): Promise<{ data: unknown[] }> {
    return requestSafe(() => api.get('team').json(), { data: [] })
  },
  async getAuditLogs(): Promise<unknown[]> {
    return []
  },
  async getSettings(): Promise<IAdminSettings> {
    return {}
  },
  async updateSettings(_settings: IAdminSettings): Promise<{ ok: true }> {
    return { ok: true }
  },
  async getStats(_period?: string, _start?: string, _end?: string): Promise<null> {
    return null
  },
  async getReferrals(): Promise<unknown[]> {
    return []
  },
  async getUserReferral(_username: string): Promise<Record<string, unknown>> {
    return {}
  },
  async setDiscount(_username: string, _percent: number): Promise<{ ok: true }> {
    return { ok: true }
  },
  async setPartner(_username: string, _isPartner: boolean): Promise<{ ok: true }> {
    return { ok: true }
  },
}
