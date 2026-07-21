import api from '../baseApi.ts'
import type { IClientProfile } from '../../types/webapp.ts'

type ProfileResponse = { data: IClientProfile }
type AvatarResponse = { url?: string }

export const clientsApi = {
  async getProfile(): Promise<IClientProfile> {
    const response = await api.get('clients/profile').json<ProfileResponse>()
    return response.data
  },
  async updateProfile(data: Partial<IClientProfile>): Promise<IClientProfile> {
    const response = await api.patch('clients/profile', { json: data }).json<ProfileResponse>()
    return response.data
  },
  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('clients/avatar', { body: formData }).json<AvatarResponse>()
      return { ok: true as const, url: response.url || '' }
    } catch {
      return { ok: false as const }
    }
  },
}
