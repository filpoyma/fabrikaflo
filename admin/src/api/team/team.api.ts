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
  async list() {
    return api.get('team').json<{ data: ITeamMember[] }>()
  },
  async create(body: ICreateTeamMember) {
    return api.post('team', { json: body }).json<{ data: ITeamMember }>()
  },
  async update(id: string, body: ICreateTeamMember) {
    return api.put(`team/${id}`, { json: body }).json<{ data: ITeamMember }>()
  },
  async uploadAvatar(id: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`team/${id}/avatar`, { body: formData }).json<{ data: ITeamMember }>()
  },
  async deleteItem(id: string) {
    return api.delete(`team/${id}`).json<{ success: boolean }>()
  },
}
