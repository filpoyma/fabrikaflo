import api from '../baseApi.ts'
import type { IClientProfile } from '../../types/webapp.ts'
import { mapProfileFromApi, mapProfileToApi, type IApiUserProfile } from './clients.mappers.ts'

export const clientsApi = {
  async getProfile(): Promise<{ data: IClientProfile }> {
    const response = await api.get('clients/profile').json<{ data: IApiUserProfile }>()
    return { data: mapProfileFromApi(response.data) }
  },
  async updateProfile(data: Partial<IClientProfile>): Promise<{ data: IClientProfile }> {
    const response = await api
      .patch('clients/profile', { json: mapProfileToApi(data) })
      .json<{ data: IApiUserProfile }>()
    return { data: mapProfileFromApi(response.data) }
  },
  async uploadAvatar(file: File): Promise<{ ok: true; url: string } | { ok: false }> {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('clients/avatar', { body: formData }).json<{ url?: string }>()
      return { ok: true, url: response.url || '' }
    } catch {
      return { ok: false }
    }
  },
}
