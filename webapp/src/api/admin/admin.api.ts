import api, { requestSafe } from '../baseApi.ts'
import type { IOrder, IRequest } from '../../types/domain.ts'
import type { IAdminSettings, IProductInput } from '../../types/webapp.ts'
import { galleryApi } from '../gallery/gallery.api.ts'

type OrdersResponse = { data?: IOrder[] }
type RequestsResponse = { data?: IRequest[] }
type TeamResponse = { data?: unknown[] }

export const adminApi = {
  getOrders: (status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return api.get(`orders${qs}`).json<OrdersResponse>().then((response) => response.data || [])
  },
  updateOrder: (id: string, status: string) =>
    api.put(`orders/${id}/status`, { json: { status } }).json(),
  getRequests: () =>
    api.get('requests').json<RequestsResponse>().then((response) => response.data || []),
  convertRequest: (id: string, data: Record<string, unknown>) =>
    api.post(`requests/${id}/convert`, { json: data }).json(),
  getProducts: () => galleryApi.list(),
  uploadImage: (file: File) => galleryApi.uploadImage(file),
  createProduct: (data: IProductInput) => galleryApi.create(data),
  updateProduct: (id: string, data: IProductInput) => galleryApi.update(id, data),
  deleteProduct: (id: string) => galleryApi.delete(id),
  toggleProduct: async (_id: string) => ({ ok: true as const }),
  updateProductStock: async (_id: string, _data: Record<string, unknown>) => ({ ok: true as const }),
  createCategory: async (_data: Record<string, unknown>) => ({ ok: true as const }),
  deleteCategory: async (_slug: string) => ({ ok: true as const }),
  addTeamMember: (data: Record<string, unknown>) =>
    requestSafe(() => api.post('team', { json: data }).json(), { ok: true }),
  deleteTeamMember: (id: string) =>
    requestSafe(() => api.delete(`team/${id}`).json(), { ok: true }),
  getTeamMembers: () =>
    requestSafe(() => api.get('team').json<TeamResponse>(), { data: [] }).then(
      (response) => response?.data || [],
    ),
  getAuditLogs: async () => [] as unknown[],
  getSettings: async () => ({}) as IAdminSettings,
  updateSettings: async (_settings: IAdminSettings) => ({ ok: true as const }),
  getStats: async (_period?: string, _start?: string, _end?: string) => null,
  getReferrals: async () => [] as unknown[],
  getUserReferral: async (_username: string) => ({}),
  setDiscount: async (_username: string, _percent: number) => ({ ok: true as const }),
  setPartner: async (_username: string, _isPartner: boolean) => ({ ok: true as const }),
}
