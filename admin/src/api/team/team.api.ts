import api from '../baseApi.ts'

export interface ITeamMember {
  id: string
  name: string | null
  tgname: string | null
  login: string | null
  phone: string | null
  role: 'ADMIN' | 'COURIER'
  telegramId: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface ICreateTeamMember {
  name: string
  tgname?: string
  login?: string
  phone?: string
  role: 'ADMIN' | 'COURIER'
  password?: string
}

export const teamApi = {
  async list(): Promise<{ data: ITeamMember[] }> {
    return api.get('team').json()
  },
  async create(body: ICreateTeamMember): Promise<{ data: ITeamMember }> {
    return api.post('team', { json: body }).json()
  },
  async update(id: string, body: ICreateTeamMember): Promise<{ data: ITeamMember }> {
    return api.put(`team/${id}`, { json: body }).json()
  },
  async uploadAvatar(id: string, file: File): Promise<{ data: ITeamMember }> {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`team/${id}/avatar`, { body: formData }).json()
  },
  async deleteItem(id: string): Promise<{ success: boolean }> {
    return api.delete(`team/${id}`).json()
  },
}
