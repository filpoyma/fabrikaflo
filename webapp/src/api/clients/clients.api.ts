import api from '../baseApi.ts'
import type { IClientProfile } from '../../types/webapp.ts'

export const clientsApi = {
  async getProfile(): Promise<{ data: IClientProfile }> {
    return api.get('clients/profile').json()
  },
  async updateProfile(data: Partial<IClientProfile>): Promise<{ data: IClientProfile }> {
    return api.patch('clients/profile', { json: data }).json()
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
